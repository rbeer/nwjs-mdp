'use strict';

let document;
let ui = {};

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

ui.toggleRequestAnimation = (start) => {
  document.querySelector('[data-refresh]').classList[start ? 'add' : 'remove']('fa-spin');
};

ui.initUI = () => {
  ui.contentElement = document.getElementsByTagName('content')[0];
  ui.initContextMenu();
};

module.exports = (ctxDoc) => {
  document = ctxDoc;
  return ui;
};
