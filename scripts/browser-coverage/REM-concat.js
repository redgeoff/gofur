#!/usr/bin/env node

// TODO: remove and put logic in server

'use strict';

var path = require('path'),
  argv = require('minimist')(process.argv.slice(2));

if (!argv.c || !argv.t) {
  console.log('Usage: concat -c cache-dir -t test-js-file [ -p port ]');
  process.exit(-1);
}

var HTTP_PORT = argv.p ? argv.p : 8001;

var cacheDir = path.join(argv.c, 'browser-coverage');

var istanbul = require('browserify-istanbul');

var path = require('path');
var mkdirp = require('mkdirp-promise');
var fs = require('fs');
var utils = require('../utils');
var indexfile = argv.t;
var dotfile = cacheDir + '/.bundle.js';
var outfile = cacheDir + '/bundle.js';
var browserify = require('browserify');

var b = browserify(indexfile, {
  cache: {},
  packageCache: {},
  fullPaths: true,
  debug: true
});

b.transform(istanbul({
  ignore: ['**/node_modules/**']
}));

function bundle() {
  var bun = b.bundle();

  bun.on('error', function (err) {
    console.error(String(err));
  });
  bun.on('end', end);
  bun.pipe(fs.createWriteStream(dotfile));

  function end() {
    fs.rename(dotfile, outfile, function (err) {
      if (err) {
        return console.error(err);
      }
      console.log('Updated:', outfile);
    });
  }
}

mkdirp(cacheDir).then(function () {
  bundle();
});
