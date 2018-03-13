#!/usr/bin/env node

'use strict';

var argv = require('minimist')(process.argv.slice(2));
var Server = require('./server');
var path = require('path');
var utils = require('../utils');
var runner = require('mocha-headless-chrome');
var fs = require('fs-extra');
var path = require('path');
var querystring = require('querystring');

if (!argv.c || !argv.t) {
  console.log([
    'Usage: test -c cache-dir -t test-js-file [ -p port ] [ -g reg-ex ]',
    '[ -s script ]'
  ].join(' '));
  process.exit(1);
}

var server = new Server(argv.c, argv.t, argv.p);

var cacheDir = argv.c;

var runTests = function (grep) {
  let qs = {};
  if (grep) {
    qs.grep = grep;
  }
  return runner({
    file: 'http://127.0.0.1:' + server._port + '/browser-coverage/index.html?' + querystring.stringify(qs),
    timeout: 180000
  });
};

var saveCoverage = function (coverage) {
  var dir = path.join(cacheDir, 'coverage/browser');
  var file = path.join(dir, 'coverage.json');
  return fs.ensureDir(dir).then(function () {
    console.log('Writing coverage to ' + file);
    return fs.writeFile(file, JSON.stringify(coverage));
  });
};

utils.startIfScript(argv.s).then(function () {
  return server.serve();
}).then(function () {
  return runTests(argv.g);
}).then(function (result) {
  return saveCoverage(result.coverage);
}).then(function () {
  // It appears that a bug in MochaHeadlessChrome leaves events running so we have to force an exit
  utils.quit(0);
}).catch(function (err) {
  console.error(err);
  utils.quit(1);
});
