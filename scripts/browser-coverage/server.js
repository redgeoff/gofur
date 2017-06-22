#!/usr/bin/env node

// TODO: refactor into OOP and bin layer

'use strict';

var path = require('path'),
  argv = require('minimist')(process.argv.slice(2));

var istanbul = require('browserify-istanbul');
var path = require('path');
var mkdirp = require('mkdirp-promise');
var fs = require('fs');
var utils = require('../utils');
var browserify = require('browserify');
var http = require('http');
var express = require('express');

if (!argv.c || !argv.t) {
  console.log('Usage: concat -c cache-dir -t test-js-file [ -p port ]');
  process.exit(-1);
}

var HTTP_PORT = argv.p ? argv.p : 8001;
var cacheDir = path.join(argv.c, 'browser-coverage');
var indexfile = argv.t;
var dotFile = cacheDir + '/.bundle.js';
var outFile = cacheDir + '/bundle.js';
var app = express();
var utils = require('../utils');

var b = browserify(indexfile, {
  cache: {},
  packageCache: {},
  fullPaths: true,
  debug: true
});

b.transform(istanbul({
  ignore: ['**/node_modules/**']
}));

var files = [{
    src: path.join(__dirname, 'index.html'),
    dst: path.join(cacheDir, 'index.html')
  },
  {
    src: path.join(__dirname, '../../node_modules/mocha/mocha.css'),
    dst: path.join(cacheDir, 'mocha.css')
  },
  {
    src: path.join(__dirname, '../../node_modules/mocha/mocha.js'),
    dst: path.join(cacheDir, 'mocha.js')
  },
  {
    src: path.join(__dirname, '../../node_modules/chai/chai.js'),
    dst: path.join(cacheDir, 'mocha.js')
  }
];

mkdirp(cacheDir).then(function () {
  // We need to copy files to the cache so that we can expose a single directory to our web server
  return utils.copyFiles(files);
}).then(function () {
  return utils.concat(b, dotFile, outFile);
}).then(function () {
  app.use(express.static(cacheDir));
  var server = http.createServer(app);
  server.listen(HTTP_PORT);
});
