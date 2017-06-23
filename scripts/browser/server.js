'use strict';

var BaseServer = require('../server'),
  inherits = require('inherits'),
  path = require('path');

var Server = function () {
  BaseServer.apply(this, arguments);
};

Server.prototype._name = 'browser';

Server.prototype._filesToCopy = function () {
  return [{
      src: path.join(__dirname, 'index.html'),
      dst: path.join(this._htmlDir, 'index.html')
    },
    {
      src: path.join(__dirname, 'webrunner.js'),
      dst: path.join(this._htmlDir, 'webrunner.js')
    },
    {
      src: path.join(__dirname, '../../node_modules/mocha/mocha.css'),
      dst: path.join(this._htmlDir, 'mocha.css')
    },
    {
      src: path.join(__dirname, '../../node_modules/mocha/mocha.js'),
      dst: path.join(this._htmlDir, 'mocha.js')
    }
  ];
};

inherits(Server, BaseServer);

module.exports = Server;
