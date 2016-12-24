'use strict';

const fs = require('fs');
const rp = require('request-promise');

class RenderRequest {
  constructor(inputFile, type) {
    this.resolved = false;
    this.type = type;
    this.raw = this.type === 'raw';
    this.input = fs.readFileSync(inputFile);
    this.compiled = '';
    this.compiledHTMLDocument = null;
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
      body: this.input,
      headers: {
        'content-type': this.raw ? 'text/x-markdown' : 'application/json',
        'User-Agent': 'nwjs-markdown-preview'
      }
    };

    return rp(options);
  }

}

module.exports = RenderRequest;
