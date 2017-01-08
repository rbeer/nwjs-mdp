(() => {
  
  'use strict';

  const fs = require('fs');
  const rp = require('request-promise');

  class RenderRequest {
    constructor(inputFile, type) {
      this.resolved = false;
      this.type = type;
      this.raw = this.type === 'raw';
      this.input = {
        path: inputFile,
        content: fs.readFileSync(inputFile),
        stat: fs.statSync(inputFile)
      };
      this.compiled = '';
      this.compiledHTMLDocument = null;
      this.fileWatcher = null;
    }

    compile() {
      let self = this;
      return this.requestFromGitHub()
        .then((compiled) => {
          let domParser = new DOMParser();
          self.resolved = true;
          self.compiled = RenderRequest.upgradeSmileys(`${compiled}`);
          self.compiledHTMLDocument = domParser.parseFromString(self.compiled, 'text/html');
          return self;
        });
    }

    static upgradeSmileys(htmlSrc) {
      let emojiRX = /<g-emoji alias="(.*?)" fallback-src="(.*?)".*?>(.*?)<\/g-emoji>/g;
      let replacement = '<img class="img-emoji" src="$2" alt=":$1}: | $3}" />';
      return htmlSrc.replace(emojiRX, replacement);
    }

    requestFromGitHub() {
      let options = {
        method: 'POST',
        uri: `https://api.github.com/markdown${this.raw ? '/raw' : ''}`,
        body: this.raw ? this.input.content : JSON.stringify({ text: this.input.content, mode: this.type || 'markdown' }),
        headers: {
          'content-type': this.raw ? 'text/x-markdown' : 'application/json',
          'User-Agent': 'nwjs-markdown-preview'
        }
      };

      return rp(options);
    }

    startFileWatcher(handler) {
      this.fileWatcher = fs.watch(this.input.path, { persistent: false }, handler);
    }

    stopFileWatcher() {
      this.fileWatcher.close();
      this.fileWatcher = null;
    }

    updateInput() {
      return new Promise((resolve, reject) => {
        let newStat = fs.statSync(this.input.path);
        let same_mtime = newStat.mtime.getTime() === this.input.stat.mtime.getTime();
        let sameSize = newStat.size === this.input.stat.size;
        if (same_mtime || sameSize) {
          return reject(new Error('File\'s content didn\'t change.'));
        } else {
          this.input.content = fs.readFileSync(this.input.path);
          this.input.stat = newStat;
          return resolve();
        }
      });
    }

  }

  window.app.RenderRequest = RenderRequest;
})();
