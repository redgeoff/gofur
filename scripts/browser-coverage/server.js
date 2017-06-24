'use strict';

var BaseServer = require('../server'),
  inherits = require('inherits'),
  path = require('path'),
  istanbul = require('browserify-istanbul');

var Server = function () {
  BaseServer.apply(this, arguments);
};

Server.prototype._name = 'browser-coverage';

Server.prototype._transform = function () {
  this._b.transform(istanbul({
    ignore: ['**/node_modules/**']
  }));
};

Server.prototype._filesToCopy = function (modulesDir) {
  return [{
      src: path.join(__dirname, 'index.html'),
      dst: path.join(this._htmlDir, 'index.html')
    },
    {
      src: path.join(modulesDir, 'mocha/mocha.css'),
      dst: path.join(this._htmlDir, 'mocha.css')
    },
    {
      src: path.join(modulesDir, 'mocha/mocha.js'),
      dst: path.join(this._htmlDir, 'mocha.js')
    },
    {
      src: path.join(modulesDir, 'chai/chai.js'),
      dst: path.join(this._htmlDir, 'chai.js')
    }
  ];
};

inherits(Server, BaseServer);

module.exports = Server;
