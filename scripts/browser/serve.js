#!/usr/bin/env node

'use strict';

var argv = require('minimist')(process.argv.slice(2)),
  Server = require('./server');

if (!argv.c || !argv.t) {
  console.log('Usage: concat -c cache-dir -t test-js-file [ -p port ]');
  process.exit(1);
}

var server = new Server(argv.c, argv.t, argv.p);

server.serve().catch(function (err) {
  console.error(err);
  process.exit(1);
});
