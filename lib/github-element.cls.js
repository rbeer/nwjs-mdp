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
   *       <div class="pull-right title-text github-ratelimit">
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
        rlDiv.className = 'pull-right title-text github-ratelimit';
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
       * @type {{ limit: string, remaining: string, reset: number }}
       */
      this.rateLimitData = {
        limit: null,
        remaining: null,
        reset: null
      };
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
  }

  window.app.GitHubElement = GitHubElement;

})();
