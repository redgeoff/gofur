// TODO: should be able to reuse a lot of logic between browser and browser-coverage

'use strict';

var path = require('path'),
  istanbul = require('browserify-istanbul'),
  mkdirp = require('mkdirp-promise'),
  utils = require('../utils'),
  browserify = require('browserify'),
  http = require('http'),
  express = require('express'),
  Promise = require('bluebird');

var Server = function (cacheDir, testJsFile, port) {
  this._cacheDir = cacheDir;
  this._testJsFile = testJsFile;
  this._port = port ? port : Server.DEFAULT_PORT;

  this._app = express();
  this._htmlDir = path.join(this._cacheDir, 'browser-coverage');
  this._dotFile = this._htmlDir + '/.bundle.js';
  this._outFile = this._htmlDir + '/bundle.js';
};

Server.DEFAULT_PORT = 8001;

Server.prototype._concat = function () {
  this._b = browserify(this._testJsFile, {
    cache: {},
    packageCache: {},
    fullPaths: true,
    debug: true
  });

  this._b.transform(istanbul({
    ignore: ['**/node_modules/**']
  }));

  return utils.concat(this._b, this._dotFile, this._outFile);
};

Server.prototype._copyFiles = function () {

  // We need to copy files to the cache so that we can expose a single directory to our web server

  return utils.copyFiles([{
      src: path.join(__dirname, 'index.html'),
      dst: path.join(this._htmlDir, 'index.html')
    },
    {
      src: path.join(__dirname, '../../node_modules/mocha/mocha.css'),
      dst: path.join(this._htmlDir, 'mocha.css')
    },
    {
      src: path.join(__dirname, '../../node_modules/mocha/mocha.js'),
      dst: path.join(this._htmlDir, 'mocha.js')
    },
    {
      src: path.join(__dirname, '../../node_modules/chai/chai.js'),
      dst: path.join(this._htmlDir, 'chai.js')
    }
  ]);

};

Server.prototype._createHTMLDir = function () {
  return mkdirp(this._htmlDir);
};

Server.prototype._createServer = function () {
  this._app.use(express.static(this._cacheDir));
  this._server = http.createServer(this._app);
};

Server.prototype._listen = function () {
  var self = this;
  return new Promise(function (resolve) {
    self._server.listen(self._port, resolve);
  });
};

Server.prototype._createServerAndListen = function () {
  this._createServer();
  return this._listen();
};

Server.prototype.serve = function () {
  var self = this;

  return self._createHTMLDir().then(function () {
    return self._copyFiles();
  }).then(function () {
    return self._concat();
  }).then(function () {
    return self._createServerAndListen();
  }).then(function () {
    console.log('Tests: http://127.0.0.1:' + self._port + '/browser-coverage/index.html');
  });
};

module.exports = Server;
