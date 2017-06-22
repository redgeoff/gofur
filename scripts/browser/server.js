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
var fs = require('fs');
var indexfile = argv.t;
var dotfile = argv.c + '/.bundle.js';
var outfile = argv.c + '/bundle.js';
var watchify = require('watchify');
var browserify = require('browserify');

// TODO: make this configurable via an env var
// Watchify appears to occasionally cause "Error: watch ENOSPC" errors in saucelabs so we'll just
// disable it.
var useWatchify = false;

var b = browserify(indexfile, {
  cache: {},
  packageCache: {},
  fullPaths: true,
  debug: true
});

var filesWritten = false;
var serverStarted = false;
var readyCallback;

function bundle() {
  var wb = (useWatchify ? w.bundle() : b.bundle());
  wb.on('error', function (err) {
    console.error(String(err));
  });
  wb.on('end', end);
  wb.pipe(fs.createWriteStream(dotfile));

  function end() {
    fs.rename(dotfile, outfile, function (err) {
      if (err) {
        return console.error(err);
      }
      console.log('Updated:', outfile);
      filesWritten = true;
      checkReady();
    });
  }
}

if (useWatchify) {
  var w = watchify(b);
  w.on('update', bundle);
}

bundle();

var copyFiles = function () {
  return utils.copyFiles([{
      src: path.join(__dirname, 'index.html'),
      dst: path.join(cacheDir, 'index.html')
    },
    {
      src: path.join(__dirname, 'webrunner.js'),
      dst: path.join(cacheDir, 'webrunner.js')
    },
    {
      src: path.join(__dirname, '../../node_modules/mocha/mocha.css'),
      dst: path.join(cacheDir, 'mocha.css')
    },
    {
      src: path.join(__dirname, '../../node_modules/mocha/mocha.js'),
      dst: path.join(cacheDir, 'mocha.js')
    }
  ]);
};

function startServers(callback) {
  readyCallback = callback;

  // We need to copy files to the cache so that we can expose a single directory to our web server
  return copyFiles().then(function () {
    app.use(express.static(cacheDir));
    var server = http.createServer(app);
    server.listen(HTTP_PORT, function () {
      console.log('Tests: http://127.0.0.1:' + HTTP_PORT + '/index.html');
      serverStarted = true;
      checkReady();
    });
  });
}

function checkReady() {
  if (filesWritten && serverStarted && readyCallback) {
    readyCallback();
  }
}

if (require.main === module) {
  startServers();
} else {
  module.exports.start = startServers;
}
