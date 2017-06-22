#!/usr/bin/env node

// TODO: refactor into OOP and bin layer

'use strict';

var path = require('path'),
  argv = require('minimist')(process.argv.slice(2));

if (!argv.c || !argv.t) {
  console.log('Usage: server -c cache-dir -t test-js-file [ -p port ]');
  process.exit(-1);
}

var HTTP_PORT = argv.p ? argv.p : 8001;

var htmlDir = path.join(argv.c, 'browser');

var http = require('http');
var express = require('express');
var app = express();

var utils = require('../utils');
var fs = require('fs');
var indexfile = argv.t;
var dotFile = htmlDir + '/.bundle.js';
var outFile = htmlDir + '/bundle.js';
var browserify = require('browserify');
var mkdirp = require('mkdirp-promise');

var b = browserify(indexfile, {
  cache: {},
  packageCache: {},
  fullPaths: true,
  debug: true
});

var files = [{
    src: path.join(__dirname, 'index.html'),
    dst: path.join(htmlDir, 'index.html')
  },
  {
    src: path.join(__dirname, 'webrunner.js'),
    dst: path.join(htmlDir, 'webrunner.js')
  },
  {
    src: path.join(__dirname, '../../node_modules/mocha/mocha.css'),
    dst: path.join(htmlDir, 'mocha.css')
  },
  {
    src: path.join(__dirname, '../../node_modules/mocha/mocha.js'),
    dst: path.join(htmlDir, 'mocha.js')
  }
];

mkdirp(htmlDir).then(function () {
  // We need to copy files to the cache so that we can expose a single directory to our web server
  return utils.copyFiles(files);
}).then(function () {
  return utils.concat(b, dotFile, outFile);
}).then(function () {
  app.use(express.static(argv.c));
  var server = http.createServer(app);
  server.listen(HTTP_PORT, function () {
    console.log('Tests: http://127.0.0.1:' + HTTP_PORT + '/browser/index.html');
  });
});
