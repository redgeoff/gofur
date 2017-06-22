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

var cacheDir = argv.c;

var http = require('http');
var express = require('express');
var app = express();
var utils = require('../utils');

var copyFiles = function () {
  return utils.copyFiles([{
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
  ]);
};

// We need to copy files to the cache so that we can expose a single directory to our web server
copyFiles().then(function () {
  app.use(express.static(cacheDir));
  var server = http.createServer(app);
  server.listen(HTTP_PORT, function () {
    console.log('Tests: http://127.0.0.1:' + HTTP_PORT + '/index.html');
  });
});
