'use strict';

var path = require('path'),
  mkdirp = require('mkdirp-promise'),
  utils = require('./utils'),
  browserify = require('browserify'),
  http = require('http'),
  express = require('express'),
  Promise = require('bluebird');

var Server = function (cacheDir, testJsFile, port) {
  this._cacheDir = cacheDir;
  this._testJsFile = testJsFile;
  this._port = port ? port : Server.DEFAULT_PORT;

  this._app = express();
  this._htmlDir = path.join(this._cacheDir, this._name);
  this._dotFile = this._htmlDir + '/.bundle.js';
  this._outFile = this._htmlDir + '/bundle.js';
};

Server.DEFAULT_PORT = 8001;

Server.prototype._transform = function () {};

Server.prototype._concat = function () {
  this._b = browserify(this._testJsFile, {
    cache: {},
    packageCache: {},
    fullPaths: true,
    debug: true
  });

  this._transform();

  return utils.concat(this._b, this._dotFile, this._outFile);
};

Server.prototype._writeConfig = function (config) {
  // Provide the location of the cacheDir to phantom-hooks. TODO: is there a cleaner way?
  return utils.writeFile(path.join(this._htmlDir, 'config.js'), 'window.gofurConfig=' +
    JSON.stringify(config));
};

// We need to copy files to the cache so that we can expose a single directory to our web server
Server.prototype._copyFiles = function () {
  var self = this;
  return utils.fileExists(path.join(__dirname, '../node_modules')).then(function (exists) {
    // Is this script being run from another node module? If so, then adjust the path to the
    // modules
    var modulesDir = null;
    if (exists) {
      modulesDir = path.join(__dirname, '../node_modules');
    } else {
      modulesDir = path.join(__dirname, '../..');
    }

    return utils.copyFiles(self._filesToCopy(modulesDir));
  });
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
    return self._writeConfig({
      cacheDir: self._cacheDir
    });
  }).then(function () {
    return self._concat();
  }).then(function () {
    return self._createServerAndListen();
  }).then(function () {
    console.log('Tests: http://127.0.0.1:' + self._port + '/' + self._name + '/index.html');
  });
};

module.exports = Server;
