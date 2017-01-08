'use strict';

/**
 * Reads -f and -w options from argv and returns
 * their values as members of an object.
 * @param  {Array.<{string}>} argv
 * @return {object.<f:{string},w:{bool}>}
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
    UI: require('./lib/ui.js'),
    RenderRequest: require('./lib/render-request.js')
  };

  // RenderRequest - handling communication with GitHub API
  const request = new app.RenderRequest(inputPath, 'raw');

  // executes the RenderRequest and displays its result
  app.render = () => {
    // send the refresh icon spinning
    app.UI.toggleRequestAnimation(true);

    // execute (TODO: rename .compile->.send) request
    // returns itself (i.e. instance of RenderRequest)
    request.compile().then((req) => {
      // update content with result markup
      app.UI.setContent(req.compiledHTMLDocument);
      // flash effect to notify user
      app.UI.flashContent();
    })
    .catch((err) => {
      // TODO: 403, github API limit!
      console.log(err);
    })
    .finally(app.UI.toggleRequestAnimation); // no matter what, stop spinning
                                             // the refresh button
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
    app.UI.toggleFilewatcher(toState);
  };

  // opens or closes raw html modal
  // sets current rendering
  app.toggleRawModal = () => {
    app.UI.toggleRawModal(request.compiled);
  };

  // closes the app; dummy for cleanup routine
  app.close = () => gui.App.quit();

  // expose app to window context
  window.app = app;
  // expose system clipboard to window context
  window.clipboard = gui.Clipboard.get();

  // init main layout, buttons, etc.
  app.UI.init(window);
  app.UI.setFileNameTitle(inputPath);
  // render and display `inputPath`
  app.render();

  // enable file-watcher if -w is true
  if (options.w) {
    app.toggleFilewatcher();
  }
};

// init app when all DOM Elements are available
document.addEventListener('DOMContentLoaded', _init);
