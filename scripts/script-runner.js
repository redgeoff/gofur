'use strict';

var sporks = require('sporks');
// var config = require('../server-config-safe');
var spawn = require('child_process').spawn;
// var utils = require('./utils');
// var path = require('path');
// var JSONStream = require('JSONStream');
// var Promise = require('sporks/scripts/promise');

var ScriptRunner = function () {};

ScriptRunner.prototype._spawn = function (command, opts, ignoreErrors) {

  var child = spawn(command, opts);

  var onData = function (logEntry) {
    // Uncomment for extra debugging
    //
    // console.log('logEntry=', logEntry, '\n');

    // An error entry? There shouldn't be any errors
    if (!ignoreErrors) {
      console.error(logEntry);
    }
  };

  child.stdout.on('data', onData);

  // Uncomment for extra debugging
  //
  // child.stderr.on('data', function (data) {
  //   console.error('should not get data on stderr ' + JSON.stringify(opts) + ', data=' + data);
  // });

  child.on('error', function (err) {
    console.error(err.message + ' for ' + JSON.stringify(opts));
  });

  child.on('close', function (code) {
    if (code > 0) {
      console.error('non-zero exit code for ' + JSON.stringify(opts));
    }
  });

  var closed = sporks.once(child, 'close');

  return {
    child: child,
    closed: closed
  };
};

ScriptRunner.prototype.run = function (path, ignoreErrors) {
  return this._spawn(path, null, ignoreErrors);
};

module.exports = new ScriptRunner();
