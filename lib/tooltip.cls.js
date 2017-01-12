'use strict';

(() => {

  /**
   * Tooltip component for title bar icons
   * @module tooltip
   */
  let toolTip = {
    toolTipElement: null,
    triggerElements: [],
    timeouts: {
      hide: null,
      show: null
    },
    get isOpen() {
      return !!toolTip.toolTipElement.dataset.open;
    },
    set isOpen(val) {
      val ? toolTip.toolTipElement.dataset.open = 'true' : delete toolTip.toolTipElement.dataset.open;
    }
  };

  /**
   * Initializes tooltip component
   * @memberOf module:tooltip
   * @return {Promise}
   */
  toolTip.init = () => {
    return new Promise((resolve) => {
      toolTip.toolTipElement = document.querySelector('[data-tooltip]');
      toolTip.triggerElements = Array.from(document.querySelectorAll('[data-tooltip-text]'));

      toolTip.triggerElements.forEach((trigger) => trigger.addEventListener('mouseenter', _mouseEnter));
      toolTip.triggerElements.forEach((trigger) => trigger.addEventListener('mouseout', _mouseOut));

      resolve();
    });
  };

  /**
   * Shows the tooltip container, by setting the text and sliding
   * its center to given x position.
   * @memberOf module:tooltip
   * @param  {string}  text    - Text to display on tooltip
   * @param  {number}  showAtX - X coordinate, the center of the tooltip shall move to
   * @return {Promise}         - Resolves, when (right-value-) transition ends
   */
  toolTip.show = (text, showAtX) => {
    return new Promise((resolve, reject) => {
      toolTip.clearTimeout('hide');

      let ttElement = toolTip.toolTipElement;

      // set text before calculating new position ('cause based on width)
      ttElement.innerText = text;

      // right end of tooltip @ target position
      let rightX = window.innerWidth - showAtX;
      // center of tooltip @ target position
      let centerX = rightX - ttElement.offsetWidth / 2;
      // catch and fix clipping
      centerX = centerX > 14 ? centerX : 14;

      ttElement.addEventListener('transitionEnd', resolve);
      ttElement.style.right = `${centerX}px`;
      toolTip.isOpen = true;
    });
  };

  /**
   * Hides the tooltip.
   * @memberOf module:tooltip
   * @return {Promise}
   */
  toolTip.hide = () => {
    return new Promise((resolve, reject) => {

      let ttElement = toolTip.toolTipElement;
      ttElement.addEventListener('transitionEnd', resolve);
      ttElement.style.right = `-${(ttElement.offsetWidth) + 10}px`;
      toolTip.isOpen = false;
    });
  };

  /**
   * Clears a timeout that would hide or show the tooltip.
   * @memberOf module:tooltip
   * @param {string} type - 'show' or 'hide'; whichever timeout shall be canceled
   */
  toolTip.clearTimeout = (type) => {
    if (toolTip.timeouts[type]) {
      window.clearTimeout(toolTip.timeouts[type]);
      toolTip.timeouts[type] = null;
    }
  };

  /**
   * Handler for `mouseout` event on tooltip triggers.
   * @param  {MoueEvent} mouseEvent
   */
  let _mouseOut = (mouseEvent) => {
    mouseEvent.preventDefault();
    toolTip.clearTimeout('hide');
    toolTip.timeouts.hide = window.setTimeout(toolTip.hide, 500);
    return false;
  };

  /**
   * Handler for `mouseenter` event on tooltip triggers.
   * @param  {MoueEvent} mouseEvent
   */
  let _mouseEnter = (mouseEvent) => {

    let text = mouseEvent.target.dataset.tooltipText;
    if (!text) {
      return;
    }

    mouseEvent.preventDefault();

    // immediately change text and slide over, if tooltip
    // is already visible
    if (toolTip.isOpen) {
      toolTip.show(text, mouseEvent.x);
    } else {
      // cancel previous timeout
      if (toolTip.timeouts.show) {
        toolTip.clearTimeout('show');
      }

      // start timeout to show tooltip
      toolTip.timeouts.show = window.setTimeout(() => {
        toolTip.show(text, mouseEvent.x);
      }, 1000);
    }

    return false;
  };

  // expose tooltip module to global context
  window.app.toolTip = toolTip;

})();
