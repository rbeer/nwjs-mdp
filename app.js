let parseArgv = (args) => {
  let options = {
    i: '',        // no standard input file; -i ''
    w: true,      // auto attach file-watcher; -w true
  };
  for (let key in options) {
    let flagIdx = args.indexOf('-' + key);
    if (flagIdx > -1) {
      options[key] = args[flagIdx + 1];
    }
  }
  return options;
};

let _init = () => {
  const gui = require('nw.gui');
  const options = parseArgv(gui.App.argv);
  const inputPath = options.i;

  if (!inputPath) {
    alert(`Can't read from ${inputPath}.`);
    inputPath = './README.md';
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
    let state = request.fileWatcher ? false : true;
    if (state) {
      request.startFileWatcher((type, fileName) => {
        if (type === 'change') {
          request.updateInput()
          .then(app.render)
          .catch((err) => {});
        }
      });
    } else {
      request.stopFileWatcher();
    }
    app.UI.toggleFilewatcher(state);
  };

  app.showRawModal = () => {
    app.UI.showRawModal(request.compiled);
  };

  app.close = () => gui.App.quit();

  window.app = app;
  window.clipboard = gui.Clipboard.get();

  app.UI.init(window);
  app.render();
  if (options.w) {
    app.toggleFilewatcher();
  }
};

document.addEventListener('DOMContentLoaded', _init);
