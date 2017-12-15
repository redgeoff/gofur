'use strict';

var fs = require('fs'),
  Promise = require('sporks/scripts/promise'),
  scriptRunner = require('./script-runner'),
  sporks = require('sporks');

var Utils = function () {
  this._writeFile = Promise.promisify(fs.writeFile);
  this._script = null;
  this._seleniumChild = null;
};

Utils.prototype.copyFile = function (srcPath, dstPath) {
  return new Promise(function (resolve, reject) {
    var rs = fs.createReadStream(srcPath);
    rs.on('error', reject);

    var ws = fs.createWriteStream(dstPath);
    ws.on('error', reject);

    rs.pipe(ws);

    ws.on('finish', resolve);
  });
};

Utils.prototype.copyFiles = function (files) {
  var self = this,
    promises = [];

  files.forEach(function (file) {
    promises.push(self.copyFile(file.src, file.dst));
  });

  return Promise.all(promises);
};

// TODO: also use in browser/server
Utils.prototype.concat = function (b, dotFile, outFile) {
  return new Promise(function (resolve, reject) {
    var bun = b.bundle();

    bun.on('error', function (err) {
      reject(err);
    });

    bun.on('end', end);

    bun.pipe(fs.createWriteStream(dotFile));

    function end() {
      fs.rename(dotFile, outFile, function (err) {
        if (err) {
          reject(err);
        } else {
          console.log('Updated:', outFile);
          resolve(outFile);
        }
      });
    }
  });
};

Utils.prototype.writeFile = function (file, data) {
  return this._writeFile(file, data);
};

Utils.prototype.fileExists = function (file) {
  return new Promise(function (resolve, reject) {
    fs.stat(file, function (err /* stat */ ) {
      if (err == null) {
        resolve(true);
      } else if (err.code === 'ENOENT') {
        resolve(false);
      } else {
        reject(err);
      }
    });
  });
};

Utils.prototype.setSeleniumChild = function (child) {
  this._seleniumChild = child;
};

Utils.prototype.startIfScript = function (path) {
  // Wrap so response is a promise
  var self = this;
  return Promise.resolve().then(function () {
    // Run external script?
    if (path) {
      self._script = scriptRunner.run(path);
    }
  });
};

Utils.prototype._killSelenium = function () {
  var self = this;
  return Promise.resolve().then(function () {
    // Wait for selenium to close phantomjs before killing selenium. TODO: is there a better way?
    return sporks.timeout(1000);
  }).then(function () {
    if (self._seleniumChild) {
      var seleniumClosed = sporks.once(self._seleniumChild, 'close');
      self._seleniumChild.kill();
      return seleniumClosed;
    }
  }).catch(function (err) {
    // Swallow error as we don't want to prevent the test from stopping
    console.error('error killing selenium, err=', err);
  });
};

Utils.prototype._killScript = function () {
  var self = this;
  if (self._script) {
    // Use Promise.resolve() so that we can catch errors from kill() in a promise
    return Promise.resolve().then(function () {
      self._script.child.kill();
      return self._script.closed;
    }).catch(function (err) {
      // Swallow error as we don't want to prevent the test from stopping
      console.error('error killing script, err=', err);
    });
  }
};

Utils.prototype.quit = function (code) {
  // TODO: refactor as using quit is ugly and can be cleaned up by moving from callbacks to promises
  var self = this;
  return Promise.resolve().then(function () {
    return self._killScript();
  }).then(function () {
    return self._killSelenium();
  }).then(function () {
    process.exit(code);
  });
};

module.exports = new Utils();
