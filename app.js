let parseArgv = (argv) => {
  let options = {
    f: '',        // no standard input file; -f ''
    w: true       // auto attach file-watcher; -w true
  };
  for (let key in options) {
    let flagIdx = argv.indexOf('-' + key);
    if (flagIdx > -1) {
      options[key] = argv[flagIdx + 1];
    }
  }
  options.w = options.w !== 'false';
  return options;
};

let _init = () => {
  const gui = require('nw.gui');
  const fs = require('fs');
  const accessSync = fs.accessSync;
  const path = require('path');

  const options = parseArgv(gui.App.argv);
  let inputPath = path.resolve(process.env.PWD, options.f);
  let fileReadable = false;

  try {
    accessSync(inputPath, fs.constants.R_OK);
    fileReadable = true;
  } catch (err) {}

  if (!inputPath || !fileReadable) {
    alert(`Can't read from: ${inputPath}\nDefaulting to .mdP's README...`);
    inputPath = path.resolve(process.cwd(), './README.md');
  };

  const app = {
    UI: require('./lib/ui.js'),
    RenderRequest: require('./lib/render-request.js')
  };

  const request = new app.RenderRequest(inputPath, 'raw');

  app.render = () => {
    app.UI.toggleRequestAnimation(true);
    request.compile().then((req) => {
      app.UI.setContent(req.compiledHTMLDocument);
      app.UI.flashContent();
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(app.UI.toggleRequestAnimation);
  };

  app.toggleFilewatcher = () => {
    let toState = request.fileWatcher === null;
    if (toState) {
      request.startFileWatcher((type, fileName) => {
        if (type === 'change') {
          request.updateInput()
          .then(app.render)
          .catch(() => {});
        }
      });
    } else {
      request.stopFileWatcher();
    }
    app.UI.toggleFilewatcher(toState);
  };

  app.toggleRawModal = () => {
    app.UI.toggleRawModal(request.compiled);
  };

  app.close = () => gui.App.quit();

  window.app = app;
  window.clipboard = gui.Clipboard.get();

  app.UI.init(window);
  app.UI.setFileNameTitle(inputPath);
  app.render();
  if (options.w) {
    app.toggleFilewatcher();
  }
};

document.addEventListener('DOMContentLoaded', _init);
