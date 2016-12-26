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
    let _self = this;
    return this.requestFromGitHub()
      .then((compiled) => {
        let domParser = new DOMParser();
        _self.resolved = true;
        _self.compiled = compiled;
        _self.compiledHTMLDocument = domParser.parseFromString(_self.compiled, 'text/html');
        return _self;
      });
  }

  requestFromGitHub() {
    let options = {
      method: 'POST',
      uri: `https://api.github.com/markdown${this.raw ? '/raw' : ''}`,
      body: this.input.content,
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
      };
    });
  }

}

module.exports = RenderRequest;