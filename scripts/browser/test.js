#!/usr/bin/env node

// TODO:
// - Refactor code into separate Tester class and then use here
// - Make sure the sauce labs flow is working
// - wd and other libs below now support promises so let's use them!
// - Refactor out use of process.env and use command line parameters instead

'use strict';

var wd = require('wd');
var sauceConnectLauncher = require('sauce-connect-launcher');
var selenium = require('selenium-standalone');
var querystring = require('querystring');
var SauceResultsUpdater = require('./sauce-results-updater');

var argv = require('minimist')(process.argv.slice(2)),
  Server = require('./server'),
  utils = require('../utils');

if (!argv.c || !argv.t) {
  console.log([
    'Usage: test -c cache-dir -t test-js-file [ -p port ] [ -b browser ] [ -g reg-ex ]',
    '[ -s script ]'
  ].join(' '));
  process.exit(1);
}

var server = new Server(argv.c, argv.t, argv.p);

var testTimeout = 30 * 60 * 1000;

var retries = 0;
var MAX_RETRIES = 10;
var MS_BEFORE_RETRY = 60000;

var username = process.env.SAUCE_USERNAME;
var accessKey = process.env.SAUCE_ACCESS_KEY;

var sauceResultsUpdater = new SauceResultsUpdater(username, accessKey);

// argv.b is a colon-separated list of
//   (saucelabs|selenium):browserName:browserVerion:platform:headless
var clientStr = argv.b || 'selenium:chrome:::headless';
var tmp = clientStr.split(':');
var client = {
  runner: tmp[0] || 'selenium',
  browser: tmp[1] || 'chrome',
  version: tmp[2] || null, // Latest
  platform: tmp[3] || null,
  headless: tmp[4] || true
};

var testURL = 'http://127.0.0.1:' + server._port + '/browser/index.html';
var qs = {};

var sauceClient;
var sauceConnectProcess;
var tunnelId = process.env.TRAVIS_JOB_NUMBER || 'tunnel-' + Date.now();

var jobName = tunnelId + '-' + clientStr;

var build = (process.env.TRAVIS_COMMIT ? process.env.TRAVIS_COMMIT : Date.now());

if (client.runner === 'saucelabs') {
  qs.saucelabs = true;
}
if (argv.g) {
  qs.grep = argv.g;
}

testURL += '?';
testURL += querystring.stringify(qs);

function testError(e) {
  console.error(e);
  console.error('Doh, tests failed');
  sauceClient.quit().then(function () {
    utils.quit(3);
  });
}

function postResult(result) {
  var failed = !process.env.PERF && result.failed;
  if (client.runner === 'saucelabs') {
    sauceResultsUpdater.setPassed(jobName, build, !failed).then(function () {
      utils.quit(failed ? 1 : 0);
    });
  } else {
    utils.quit(failed ? 1 : 0);
  }
}

function testComplete(result) {
  sauceClient.quit().then(function () {
    if (sauceConnectProcess) {
      sauceConnectProcess.close(function () {
        postResult(result);
      });
    } else {
      postResult(result);
    }
  });
}

function startSelenium(callback) {
  // Start selenium
  var opts = {
    // version: '2.45.0'
  };
  selenium.install(opts, function (err) {
    if (err) {
      console.error('Failed to install selenium');
      utils.quit(1);
    }
    selenium.start(opts, function (err, child) {
      if (err) {
        console.error('Failed to start selenium');
        utils.quit(1);
      }
      sauceClient = wd.promiseChainRemote();
      utils.setSeleniumChild(child);
      callback();
    });
  });
}

function startSauceConnect(callback) {

  var options = {
    username: username,
    accessKey: accessKey,
    tunnelIdentifier: tunnelId
  };

  sauceConnectLauncher(options, function (err, _sauceConnectProcess) {
    if (err) {
      console.error('Failed to connect to saucelabs, err=', err);

      if (++retries > MAX_RETRIES) {
        console.log('Max retries reached, exiting');
        utils.quit(1);
      } else {
        console.log('Retry', retries, '...');
        setTimeout(function () {
          startSauceConnect(callback);
        }, MS_BEFORE_RETRY);
      }

    } else {
      sauceConnectProcess = _sauceConnectProcess;
      sauceClient = wd.promiseChainRemote('localhost', 4445, username, accessKey);
      callback();
    }
  });
}

function startTest() {

  console.log('Starting', client);

  var opts = {
    browserName: client.browser,
    version: client.version,
    platform: client.platform,
    tunnelTimeout: testTimeout,
    name: jobName,
    'max-duration': 60 * 30,
    'command-timeout': 599,
    'idle-timeout': 599,
    'tunnel-identifier': tunnelId
  };

  if (client.browser === 'chrome' && client.headless) {
    opts.chromeOptions = {
      args: ['--headless']
    };
  }

  sauceClient.init(opts).get(testURL).then(function () {

    /* jshint evil: true */
    var interval = setInterval(function () {

      sauceClient.eval('window.results', function (err, results) {

        console.log('=> ', results);

        if (err) {
          clearInterval(interval);
          testError(err);
        } else if (results.completed || results.failures.length) {
          clearInterval(interval);
          testComplete(results);
        }

      });
    }, 10 * 1000);
  }).catch(function (err) {
    console.error(err);
    utils.quit(1);
  });
}

utils.startIfScript(argv.s).then(function () {
  return server.serve().then(function () {
    if (client.runner === 'saucelabs') {
      startSauceConnect(startTest);
    } else {
      startSelenium(startTest);
    }
  });
}).catch(function (err) {
  console.error(err);
  utils.quit(1);
});
