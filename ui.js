'use strict';

let window, document;
let ui = {
  contentElement: null
};

ui.setContent = (doc) => {
  ui.clearContent.call(ui.contentElement);
  for (let node of doc.querySelectorAll('body>*')) {
  	ui.contentElement.appendChild(node);
  }
};

ui.clearContent = function() {
  while (this.firstChild) {
  	this.removeChild(this.firstChild);
  }
};

ui.initContextMenu = () => {
  let menu = new nw.Menu();

  menu.append(new nw.MenuItem({
    label: 'Test Markdown Render',
    click: () => {
      alert(arg);
    }
  }));

  document.body.addEventListener('contextmenu', (evt) => {
    if (evt.ctrlKey) {
      return true;
    };
    evt.preventDefault();
    menu.popup(evt.x, evt.y);
    return false;
  }, false);
};

ui.controlKeysHandler = function(evt) {
  if (!evt.ctrlKey) {
    return true;
  }
  switch (evt.key) {
    case 'q':
      window.app.close();
      break;
  }
};

ui.toggleRequestAnimation = (start) => {
  document.querySelector('[data-refresh]').classList[start ? 'add' : 'remove']('fa-spin');
};

ui.flashContent = () => {
  let container = ui.contentElement.parentElement;
  container.addEventListener('animationend', (evt) => {
    container.classList.remove('update-flash');
  });
  container.classList.add('update-flash');
}

ui.init = (ctxWnd) => {
  window = ctxWnd;
  document = window.document;
  ui.contentElement = document.getElementsByTagName('content')[0];
  ui.initContextMenu();
  document.addEventListener('keyup', ui.controlKeysHandler);
};

module.exports = ui;
