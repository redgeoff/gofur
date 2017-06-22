'use strict';

var fs = require('fs'),
  Promise = require('bluebird');

var Utils = function () {};

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

module.exports = new Utils();
