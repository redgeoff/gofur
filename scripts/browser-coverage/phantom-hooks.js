'use strict';

var fs = require('fs');

module.exports = {
  afterEnd: function (runner) {
    var coverage = runner.page.evaluate(function () {
      return window.__coverage__;
    });

    // We need the cacheDir to come from the runner. TODO: is there a cleaner way?
    var gofurConfig = runner.page.evaluate(function () {
      return window.gofurConfig;
    });

    if (coverage) {
      var cacheDir = gofurConfig.cacheDir;
      console.log('Writing coverage to ' + cacheDir + '/coverage/browser/coverage.json');
      fs.write(cacheDir + '/coverage/browser/coverage.json', JSON.stringify(coverage), 'w');
    } else {
      console.log('No coverage data generated');
    }
  }
};
