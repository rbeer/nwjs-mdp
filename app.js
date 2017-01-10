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
    w: true,      // auto attach file-watcher; -w true
    d: false      // debug mode
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
    ui: null,               // ui functions
    RenderRequest: null,    // RenderRequest constructor
    GitHubElement: null,    // GitHubElement constructor
    request: null           // RenderRequest instance - handling communication with GitHub API
  };

  // augment app with debug goodies, if `-d(ebug) true`
  if (options.d) {
    _loadScript('./lib/debug.js').then(() => {
      window._debug = app._debug;
      console.debug('Welcome in debug mode!');
      console.debug('Goodies are in app._debug (or simply _debug).');
    });
  }

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
    app.request.send().then((req) => {
      // update content with result markup
      app.ui.setContent(req.compiledHTMLDocument);
      // flash effect to notify user
      app.ui.flashContent();

      finishUI(req.resHeaders);
    })
    .catch((err) => {
      // err 403 Forbidden means, the ratio limit is met
      if (err.statusCode === 403) {
        // set UI with data from responses headers (X-RateLimit-*)
        finishUI(err.response.headers);
        // show static error page for RateLimit exhaustion
        app.GitHubElement.renderRateLimitError(app.ui.githubElement.rateLimitData.reset);
      }
      console.log(err);
    });
  };

  // enables/disables file-watcher
  app.toggleFilewatcher = () => {
    // state to toggle to
    // true/toggle on, when no fileWatcher is set for the RenderRequest
    // false/toggle off, when RenderRequest has fileWatcher
    let toState = app.request.fileWatcher === null;

    if (toState) {
      // start new file-watcher
      app.request.startFileWatcher((type, fileName) => {
        if (type === 'change') {
          app.request.updateInput() // update input from changed file
          .then(app.render)     // render with updated input
          .catch(() => {});     // ignore errors
        }
      });
    } else {
      // stop file-watcher; sets app.request.fileWatcher = null
      app.request.stopFileWatcher();
    }
    // show new state in UI
    app.ui.toggleFilewatcher(toState);
  };

  // opens or closes raw html modal
  // sets current rendering
  app.toggleRawModal = () => {
    app.ui.toggleRawModal(app.request.compiled);
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
    app.request = new app.RenderRequest(inputPath, 'raw');
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
