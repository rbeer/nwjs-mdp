'use strict';

(() => {

  let nAgt = window.navigator.userAgent;
  let titleByOs = {
    linux: '/opt/nwjs-mdp/',
    win: 'C:\\nwjs-mdp\\',
    macos: '/nwjs.apps/',
    android: './',
    ios: './',
    unknown: './'
  }
  let osRX = {
    linux: /(?:Linux|X11)/,
    win: /(?:Win16|Windows )/,
    macos: /(?:MacPPC|MacIntel|Mac_PowerPC|Macintosh|Mac OS X)/,
    android: /Android/,
    ios: /(?:iPhone|iPad|iPod)/
  };
  let mdP = {};

  mdP.probeForOS = () => {
    for (let osKey in osRX) {
      if (osRX[osKey].test(nAgt)) {
        return osKey;
      }
    }
    return 'unknown';
  };

  mdP.setTitleFileName = () => {
    let $fnElement = $('.filename');
    $fnElement.text(titleByOs[mdP.probeForOS()] + 'README.md');
  };

  window.mdP = mdP;

  let _init = (evt) => {
    mdP.setTitleFileName();
    document.removeEventListener('DOMContentLoaded', _init);
  };

  document.addEventListener('DOMContentLoaded', _init);

})();
