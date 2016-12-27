'use strict';

let window, document;
let ui = {
  contentElement: null,
  modalListeners: {
    mousedown: (evt) => {
      if (evt.target.id !== 'compiled_raw') {
        ui.hideRawModal();
      }
      return true;
    },
    keydown: (evt) => {
      console.log(evt);
      if (evt.key === 'Escape') {
        ui.hideRawModal();
      }
      return true;
    }
  }
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

ui.toggleFilewatcher = (state) => {
  let fwElement = document.querySelector('[data-filewatcher]');
  fwElement.classList.add(state ? 'fa-chain' : 'fa-chain-broken');
  fwElement.classList.remove(state ? 'fa-chain-broken' : 'fa-chain');
};

ui.flashContent = () => {
  let container = ui.contentElement.parentElement;
  container.addEventListener('animationend', (evt) => {
    container.classList.remove('update-flash');
  });
  container.classList.add('update-flash');
};

let _removeModalListeners = () => {
  for (let event in ui.modalListeners) {
    document.removeEventListener(event, ui.modalListeners[event]);
  }
};

let _addModalListeners = () => {
  for (let event in ui.modalListeners) {
    document.addEventListener(event, ui.modalListeners[event]);
  }
};

ui.showRawModal = (compiled) => {
  let rawModal = document.getElementsByTagName('rawmodal')[0];

  rawModal.querySelector('#compiled_raw').value = compiled;
  _addModalListeners();
  rawModal.dataset.open = true;

};

ui.hideRawModal = () => {
  _removeModalListeners();
  delete document.getElementsByTagName('rawmodal')[0].dataset.open;
};

ui.init = (ctxWnd) => {
  window = ctxWnd;
  document = window.document;
  ui.contentElement = document.getElementsByTagName('content')[0];
  ui.initContextMenu();
  document.addEventListener('keyup', ui.controlKeysHandler);
};

module.exports = ui;
