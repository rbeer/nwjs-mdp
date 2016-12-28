'use strict';

(() => {


  let mdP = {
    agent: window.navigator.userAgent,
    os: {
      linux: {
        rx: /(?:Linux|X11)/,
        prefix: '/opt/nwjs-mdp/'
      },
      win: {
        rx: /(?:Win16|Windows )/,
        prefix: 'C:\\nwjs-mdp\\'
      },
      macos: {
        rx: /(?:MacPPC|MacIntel|Mac_PowerPC|Macintosh)/,
        prefix: '/opt/nwjs-mdp/'
      },
      macosx: {
        rx: /Mac OS X/,
        prefix: '/nwjs.app/Contents/Resources/nwjs-mdp.nw/'
      },
      android: {
        rx:  /Android/,
        prefix: './'
      },
      ios: {
        rx: /(?:iPhone|iPad|iPod)/,
        prefix: './'
      },
      unknown: {
        prefix: './'
      }
    }
  };

  mdP.probeForOS = () => {
    let os = mdP.os;
    for (let osKey in os) {
      if (os[osKey].rx.test(mdP.agent)) {
        return os[osKey];
      }
    }
    return os.unknown;
  };

  mdP.setTitleFileName = () => {
    let $fnElement = $('.filename');
    $fnElement.text(mdP.probeForOS().prefix + 'README.md');
  };

  mdP.toolbarClickHandler = (evt) => {

  };

  window.mdP = mdP;

  let _init = (evt) => {
    mdP.setTitleFileName();
    document.removeEventListener('DOMContentLoaded', _init);
  };

  document.addEventListener('DOMContentLoaded', _init);

})();
