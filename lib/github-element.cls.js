(() => {

  'use strict';

  /**
   * @class GitHub API rate limit status component
   * @throws {TypeError} If passed rootElement is not an instance of HTMLDivElement
   *                     and no element with 'data-github-element' attribute was found.
   * @example <caption>Setup HTML:</caption>
   * <body>
   *   <statusbar>
   *     <div class="pull-right" data-github-element></div>
   *   </statusbar>
   * </body>
   *
   * @example <caption>Setup JavaScript:</caption>
   * let rootDiv = document.querySelector('statusbar div');
   * let githubElement = new GitHubElement(rootDiv);
   * // ... new GitHubElement(); works too, because the <div>
   * // has the data-github-element attribute.
   *
   * @example <caption>Result HTML:</caption>
   * <body>
   *   <statusbar>
   *     <div class="pull-right" data-github-element>
   *       <i class="fa fa-pull-right fa-github"></i>
   *       <div class="pull-right title-text github-ratelimit hidden">
   *         <span data-github-ratelimit-limit>--</span> / <span data-github-ratelimit-remaining>--</span>
   *       </div>
   *     </div>
   *   </statusbar>
   * </body>
   */
  class GitHubElement {

    /**
     * Creates the widget's elements inside a given root  
     * The root element can be placed and styled at will, GitHubElement
     * will not modify/add/remove any styles/classes on it.
     * @param {HTMLDivElement} [rootElement=document.querySelector('[data-github-element]')] - <div> container for component
     */
    constructor(rootElement) {

      if (!(rootElement instanceof HTMLDivElement)) {
        rootElement = document.querySelector('[data-github-element]');
      }

      if (!rootElement) {
        let noRootErr = new TypeError();
        noRootErr.message = 'Please provide an HTMLDivElement as first argument \n' +
                            'or place a <div> with attribute data-github-element in \n' +
                            'your markup!';
        noRootErr.code = 'ENOROOT';
        throw noRootErr;
      }

      /**
       * Root/Container <div> element
       * @type {HTMLDivElement}
       */
      this.rootElement = rootElement;

      /**
       * Fontawesome GitHub icon
       * @type {HTMLElement}
       */
      this.iconElement = (() => {
        let iconEl = document.createElement('i');
        iconEl.className = 'fa fa-pull-right fa-github';
        this.rootElement.appendChild(iconEl);
        return iconEl;
      })();

      /**
       * Elements for rate limit numbers
       * @type {{ container: HTMLDivElement,
       *          limit: HTMLSpanElement,
       *          remaining: HTMLSpanElement }}
       */
      this.rateLimitElements = (() => {

        // returned object
        let rlElements = {};

        // container <div>, holds data-status value
        let rlDiv = document.createElement('div');
        rlDiv.className = 'pull-right title-text github-ratelimit hidden';
        rlElements['container'] = rlDiv;

        // HTMLSpanElements (a/k/a fields) for values
        [ 'limit', 'remaining' ].forEach((field, idx, list) => {
          let fieldSpan = document.createElement('span');
          // 'limit' -> 'Limit', 'remaining' -> 'Remaining'
          let firstUpperFieldName = field[0].toUpperCase() + field.slice(1);

          // <... data-github-ratelimit-(limit|remaining)>
          fieldSpan.dataset[`githubRatelimit${firstUpperFieldName}`] = '';
          // add initial value
          fieldSpan.appendChild(document.createTextNode('--'));
          // add field to return object
          rlElements[field] = fieldSpan;
          // add field to container element
          rlElements['container'].appendChild(fieldSpan);
          // add separator, if it's not the last field
          if (idx !== list.length - 1) {
            rlElements['container'].appendChild(document.createTextNode(' / '));
          }
        });

        this.rootElement.appendChild(rlElements['container']);

        return rlElements;
      })();

      /**
       * Data from X-RateLimit-* GitHub API response headers
       * @type {{ limit: number, remaining: number, reset: number }}
       */
      this.rateLimitData = {
        limit: -1,       // X-RateLimit-Limit: 60           | limit on api calls with current creds
        remaining: -1,   // X-RateLimit-Remaining: 52       | api calls remaining, until reset
        reset: -1,       // X-RateLimit-Reset: 1483922286   | epoch time when the rate limit resets

        date: null       // Date: Mon, 09 Jan 20...         | date of request last values came from
      };

      this.iconElement.addEventListener('click', (evt) => {
        evt.preventDefault();
        this.rateLimitElements.container.classList.toggle('hidden');
        return false;
      });
    }

    /**
     * Parses IncomingMessage.headers object into GitHubElement#rateLimitData
     * @param  {object} headers        - Headers of the GitHub API response
     * @param  {?bool}  updateElements - DOM Elements will be updated with new values, if `true`.
     * @return {GitHubElement#rateLimitData}
     */
    parseHeaders(headers, updateElements) {
      const headerRX = /X-RateLimit-(Limit|Remaining|Reset)/g;
      const exposeHeader = headers['access-control-expose-headers'];
      const hasHeaders = exposeHeader.match(headerRX).length >= 3;

      if (hasHeaders) {
        for (let key in this.rateLimitData) {
          let value = parseInt(headers['x-ratelimit-' + key], 10);
          this.rateLimitData[key] = isNaN(value) ? new Date(headers[key]) : value;
        }
      }

      if (updateElements) {
        let currentLimit = this.rateLimitData.limit;
        let currentRemaining = this.rateLimitData.remaining;
        this.rateLimitElements.limit.innerText = currentLimit;
        this.rateLimitElements.remaining.innerText = currentRemaining;
        this.status = currentRemaining === 0 ? 'err' : currentRemaining * 2 <= currentLimit ? 'warn' : '';
      }

      return this.rateLimitData;
    }

    get status() {
      return this.rootElement.dataset.status;
    }
    set status(val) {
      if (!val) {
        delete this.rootElement.dataset.status;
      } else {
        this.rootElement.dataset.status = val;
      }
    }

    /**
     * Renders static error page as <content>, when the GitHub
     * API rate limit is met (i.e. you can't send anymore requests,
     * until credentials upgrade or reset timeout has passed).
     * @param  {number} reset  - Value of GitHub API reponse headers field X-RateLimit-Reset
     * @return {Promise}
     */
    static renderRateLimitError(reset) {
      return new Promise((resolve, reject) => {
        /* ---- DOM Elements for displaying times ---- */
        // reset-in container for hours/minutes/seconds until reset
        let resetInRootElement = null;
        // references to DOM Elements, displaying hours, minutes, seconds until reset
        let resetInValueElements = { h: null, m: null, s: null };
        // hours, minutes, seconds values for reset
        let resetInValues = { h: 0, m: 0, s: 0 };
        // element with message that reset timeout is up
        let resetDoneElement = null;

        let setTimesInterval = null;

        // gets called every second by setInterval
        let setTimes = () => {

          /* ---- Mathmagics with Dates ---- */
          // reset time from headers (epoch time * 1000, since JS works with mseconds)
          let resetAtDate = new Date(reset * 1000);
          // reference date object for now
          let referenceNowDate = new Date();

          // seconds from now to reset time
          let resetInInt = (resetAtDate - referenceNowDate) / 1000;
          if (resetInInt < 0) {
            resetDoneElement.classList.remove('hidden');
            resetInRootElement.classList.add('hidden');
            return window.clearInterval(setTimesInterval);
          }
          // set hours, minutes, seconds of now -> reset
          resetInValues.h = Math.floor(resetInInt / 3600);
          resetInValues.m = Math.floor((resetInInt - resetInValues.h * 3600) / 60);
          resetInValues.s = Math.floor(resetInInt - resetInValues.m * 60 - resetInValues.h * 3600);

          // set values
          for (let key in resetInValueElements) {

            resetInValueElements[key].innerText = resetInValues[key];
          }
        };

        // read error page from fs
        require('fs').readFile('./lib/ratelimit-error.html', (err, html) => {
          if (err) {
            return reject(err);
          }
          // parse html text into a #Document
          let domParser = new DOMParser();
          let htmlElements = domParser.parseFromString(html, 'text/html');
          // fill <content> with error page Elements
          window.app.ui.setContent(htmlElements);

          // reset-at shows locale string of reset time
          window.document.querySelector('[data-reset-at]').innerText = (new Date(reset * 1000)).toLocaleString();
          // reference to data-reset-in container
          resetInRootElement = window.document.querySelector('[data-reset-in]');
          // references to Elements with data-reset-in-h/m/s
          for (let key in resetInValueElements) {
            resetInValueElements[key] = resetInRootElement.querySelector(`[data-reset-in-${key}]`);
          }
          resetDoneElement = window.document.querySelector('[data-reset-done]');
          setTimesInterval = window.setInterval(setTimes, 1000);
          resolve();
        });

      });
    }
  }

  window.app.GitHubElement = GitHubElement;

})();
