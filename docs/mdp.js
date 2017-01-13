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
        rx: /Android/,
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

  mdP.setTitleFileName = () => {
    let $fnElement = $('.filename');
    $fnElement.text(mdP.probeForOS().prefix + 'README.md');
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

  let _scrollToTarget = ($target, isTop) => {
    let $content = $('content');

    /**
    * @TODO - Something's up with the formula. scrolling to #top scrolls in place
    */

    let scrollTo = isTop ? 0 : $content.scrollTop() - $content.offset().top + $target.offset().top;
    /*console.log('content-scroll-top:', $content.scrollTop());
    console.log('- content-top:', $content.offset().top);
    console.log('+ target-top:', $target.offset().top);
    console.log('= scrollTo:', scrollTo);*/
    $content.stop().animate({
        scrollTop: scrollTo
    }, 1000);
  };

  mdP.highlight = (trigger) => {
    let $target = $(`[href="${trigger.dataset.targetHref}"`).parent();
    $('[data-focused="true"]').each((idx, el) => {
      el.dataset.focused = false;
    });
    _scrollToTarget($target, trigger.dataset.targetHref === '#top');
    if (trigger.dataset.targetHref !== '#top') {
      let $siblings = $target.nextUntil('h1', '[data-focused]');
      $target.attr('data-focused', true);
      $siblings.attr('data-focused', true);
    }
  };

  window.mdP = mdP;

  let _init = (evt) => {
    mdP.setTitleFileName();
    document.removeEventListener('DOMContentLoaded', _init);
  };

  document.addEventListener('DOMContentLoaded', _init);

})();
