#!/usr/bin/env node

'use strict';

var argv = require('minimist')(process.argv.slice(2)),
  Server = require('./server'),
  path = require('path');

if (!argv.c || !argv.t) {
  console.log('Usage: test -c cache-dir -t test-js-file [ -p port ]');
  process.exit(1);
}

var server = new Server(argv.c, argv.t, argv.p);

var runTests = function (modulesDir) {
  // // Uncomment for debugging
  // (function() {
  //   var childProcess = require('child_process');
  //   var oldSpawn = childProcess.spawn;
  //   function mySpawn() {
  //     console.log('spawn called');
  //     console.log(arguments);
  //     var result = oldSpawn.apply(this, arguments);
  //     return result;
  //   }
  //   childProcess.spawn = mySpawn;
  // })();

  var spawn = require('child_process').spawn;

  var options = [
    'http://127.0.0.1:' + server._port + '/browser-coverage/index.html',
    '--timeout', '25000',
    '--hooks', path.join(__dirname, 'phantom-hooks.js'),

    // Use a more recent version of phantomjs than that packaged with mocha-phantomjs
    '-p', path.join(modulesDir, 'phantomjs-prebuilt/bin/phantomjs')
  ];

  if (process.env.GREP) {
    options.push('-g');
    options.push(process.env.GREP);
  }

  // Unless we have mocha-phantomjs installed globally we have to specify the full path
  // var child = spawn('mocha-phantomjs', options);
  var child = spawn(path.join(modulesDir, 'mocha-phantomjs/bin/mocha-phantomjs'),
    options);

  child.stdout.on('data', function (data) {
    console.log(data.toString()); // echo output, including what could be errors
  });

  child.stderr.on('data', function (data) {
    console.error(data.toString());
  });

  child.on('error', function (err) {
    console.error(err);
  });

  child.on('close', function (code) {
    console.log('Mocha process exited with code ' + code);
    process.exit(code > 0 ? 1 : 0);
  });
};

server.serve().then(function () {
  return server.modulesDir();
}).then(function (modulesDir) {
  runTests(modulesDir);
}).catch(function (err) {
  console.error(err);
  process.exit(1);
});
