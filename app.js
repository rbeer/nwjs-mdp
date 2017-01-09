'use strict';

/**
 * Reads -f and -w options from argv and returns
 * their values as members of an object.
 * @param  {Array.<{string}>} argv
 * @return {{ f:string,w:bool }}
 */
let parseArgv = (argv) => {

  // map 'true', 'false' strings to bool
  argv = argv.map((val) => /^(false|true)$/.test(val) ? val === 'true' : val);

  // default `option: value`s
  // overwritten by found argv options
  let options = {
    f: '',        // no standard input file; -f ''
    w: true       // auto attach file-watcher; -w true
  };
  for (let key in options) {
    // index of -key in argv array
    let flagIdx = argv.indexOf('-' + key);
    // if option is used
    if (flagIdx > -1) {
      // overwrite default value with
      // value of next item in argv array
      options[key] = argv[flagIdx + 1];
    }
  }

  return options;
};

/**
 * Load scripts, using an HTMLScriptElement.  
 * Resolve and reject of the returned Promise are the element's
 * onload and onerror handlers.
 * @param  {string|Array.<string>} srcArray - A path or array of paths to load
 * @return {Promise}
 */
let _loadScript = (src) => {

  // put single source into array
  let srcPaths = src instanceof Array ? src : [ src ];

  let buildScriptElement = (src) => {
    // <script></script>
    let scriptEl = document.createElement('script');
    // define attributes...
    let attrs = {
      src: src,
      charset: 'utf-8',
      type: 'application/javascript'
    };
    // ... and add them to the element
    for (let name in attrs) {
      scriptEl.attributes.setNamedItem(document.createAttribute(name));
      scriptEl[name] = attrs[name];
    }

    return scriptEl;
  };

  let srcPromises = srcPaths.map((path) => {
    return new Promise((resolve, reject) => {

      let scriptElement = buildScriptElement(path);
      scriptElement.onload = resolve;
      scriptElement.onerror = reject;

      // add the <script> elements
      document.head.appendChild(scriptElement);
    });
  });

  return Promise.all(srcPromises);
};

let _init = () => {
  const gui = require('nw.gui');
  const fs = require('fs');
  const accessSync = fs.accessSync;
  const path = require('path');

  // get options object from argv
  const options = parseArgv(gui.App.argv);
  // resolve possibly relative inputPath
  let inputPath = path.resolve(process.env.PWD, options.f);

  // test readablity of given input path
  let fileReadable = false;
  try {
    accessSync(inputPath, fs.constants.R_OK);
    fileReadable = true;
  } catch (err) {}

  // alert about missing input
  // default to own README
  if (!inputPath || !fileReadable) {
    alert(`Can't read from: ${inputPath}\nDefaulting to .mdP's README...`);
    inputPath = path.resolve(process.cwd(), './README.md');
  };

  // --------------------- MAIN APP --------------------- //
  const app = {
    ui: null,
    RenderRequest: null,
    GitHubElement: null,
    _debug: {
      exceedUnauthedRatioLimit: () => {
        console.debug('Exceeding ratio limit for unauthorized user: ');

        let requests = {
          sent: 0,
          finished: 0,
          withError: []
        };

        let reportWhenFinished = () => {
          let errs = requests.withError;
          let sent = requests.sent;
          let finished = requests.finished;
          let failed = errs.length;

          if (finished + failed === sent) {
            let errsWithRateLimit = errs.filter((err) => err.statusCode === 403);
            let failedWithRateLimit = errsWithRateLimit.length;

            console.debug(`${sent} requests sent. %c✓`, 'color: green');

            console.debug(`${finished} requests finished without errors.`);
            console.debug(`${failed} requests failed with error. %c${failed > 0 ? '✓' : 'x'}`, `color: ${failed > 0 ? 'green' : 'red'}`);
            if (failedWithRateLimit > 0) {
              let resetHeader = parseInt(errsWithRateLimit[0].response.headers['x-ratelimit-reset'], 10) * 1000;
              console.debug(`%c${failedWithRateLimit} requests failed with statusCode 403`, 'color: white; background: green');
              let reset = new Date(resetHeader).toLocaleString();
              console.debug('Congratulations! You are now officially blocked from the GitHub API, until ' + reset);
            }
          }
        };

        for (let i = 1; i <= 65; i++) {
          let requestId = i;
          requests.sent++;
          request.send().then(() => {
            requests.finished++;
            console.debug(`Request #${requestId} finished. %c✓`, 'color: green');
            reportWhenFinished();
          })
          .catch((err) => {
            requests.withError.push(err);
            console.debug(`Request #${requestId} failed. %cx`, 'color: red');
            reportWhenFinished();
          });
          console.debug(`Request #${requestId} sent. ~`);
        }
      }
    }
  };

  // RenderRequest - handling communication with GitHub API
  let request;

  // executes the RenderRequest and displays its result
  app.render = () => {

    /**
     * Sets UI to 'after-render' state
     * @inner
     * @param  {object} headers Response headers
     */
    let finishUI = (headers) => {
      // stop spinning the refresh button
      app.ui.toggleRequestAnimation();
      // update github rate limit
      app.ui.githubElement.parseHeaders(headers, true);
    };
    // send the refresh icon spinning
    app.ui.toggleRequestAnimation(true);

    // execute request
    // returns itself (i.e. instance of RenderRequest)
    request.send().then((req) => {
      // update content with result markup
      app.ui.setContent(req.compiledHTMLDocument);
      // flash effect to notify user
      app.ui.flashContent();

      finishUI(req.resHeaders);
    })
    .catch((err) => {
      if (err.statusCode === 403) {
        finishUI(err.response.headers);
        app.ui.githubElement.renderRateLimitError();
      }
      console.log(err);
    });
  };

  // enables/disables file-watcher
  app.toggleFilewatcher = () => {
    // state to toggle to
    // true/toggle on, when no fileWatcher is set for the RenderRequest
    // false/toggle off, when RenderRequest has fileWatcher
    let toState = request.fileWatcher === null;

    if (toState) {
      // start new file-watcher
      request.startFileWatcher((type, fileName) => {
        if (type === 'change') {
          request.updateInput() // update input from changed file
          .then(app.render)     // render with updated input
          .catch(() => {});     // ignore errors
        }
      });
    } else {
      // stop file-watcher; sets request.fileWatcher = null
      request.stopFileWatcher();
    }
    // show new state in UI
    app.ui.toggleFilewatcher(toState);
  };

  // opens or closes raw html modal
  // sets current rendering
  app.toggleRawModal = () => {
    app.ui.toggleRawModal(request.compiled);
  };

  // closes the app; dummy for cleanup routine
  app.close = () => gui.App.quit();

  // expose app to window context
  window.app = app;
  // expose system clipboard to window context
  window.clipboard = gui.Clipboard.get();

  _loadScript([
    './lib/ui.js',                  // window.app.ui
    './lib/render-request.js',      // window.app.RenderRequest
    './lib/github-element.cls.js'   // window.app.GitHubElement
  ])
  .then(() => {
    // init main layout, buttons, etc.
    window.app.ui.init();
  })
  .then(() => {
    request = new window.app.RenderRequest(inputPath, 'raw');
    app.ui.setFileNameTitle(inputPath);
    // render and display `inputPath`
    app.render();

    // enable file-watcher if -w is true
    if (options.w) {
      app.toggleFilewatcher();
    }
  })
  .catch((err) => {
    if (err) {
      console.error(err);
    }
  });

};

// init app when all DOM Elements are available
document.addEventListener('DOMContentLoaded', _init);
