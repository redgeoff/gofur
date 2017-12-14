'use strict';

var fs = require('fs'),
  Promise = require('sporks/scripts/promise'),
  scriptRunner = require('./script-runner');

var Utils = function () {
  this._writeFile = Promise.promisify(fs.writeFile);
  this._script = null;
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

Utils.prototype.quit = function (code) {
  // TODO: refactor as using quit is ugly and can be cleaned up by moving from callbacks to promises
  var self = this;
  return Promise.resolve().then(function () {
    if (self._script) {
      // Use Promise.resolve() so that we can catch errors from kill() in a promise
      return Promise.resolve().then(function () {
        return self._script.child.kill();
      }).then(function () {
        return self._script.closed;
      }).catch(function (err) {
        // Swallow error as we don't want to prevent the test from stopping
        console.error('error killing script, err=', err);
      });
    }
  }).then(function () {
    process.exit(code);
  });
};

module.exports = new Utils();
