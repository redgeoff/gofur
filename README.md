# gofur

[![Circle CI](https://circleci.com/gh/redgeoff/gofur.svg?style=svg&circle-token=c8eb897fffae40e64aefdf37db7984349b851ef5)](https://circleci.com/gh/redgeoff/gofur)
[![Greenkeeper badge](https://badges.greenkeeper.io/redgeoff/gofur.svg)](https://greenkeeper.io/)

Easily run your mocha JS tests in the browser. Gofur allows you to focus on writing tests and not on the details of how to run your tests.


## Set up

    $ npm install gofur --save-dev

If you wish to view the code coverage report then you should also install istanbul

    $ npm install istanbul --save-dev


## Command line parameters

    -c cache            The path to a directory that will be used to store temporary
                        files, including code coverage reports. You should probably
                        make sure that the contents of this directory are ignored
                        with a .gitignore file
    -t test-file        The entry point for your mocha tests
    -p port             The port for running the test HTTP server, defaulted to 8001
    -b browser          A colon-separated list of
                        `(saucelabs|selenium):browserName:browserVerion:platform`
    -s path-to-script   Optional path to a script that will be run before the browser
                        tests. This script will then be killed after the tests. This
                        script can be used to set up fixtures.

## Run tests in phantomjs and generate code coverage

    $ node_modules/gofur/scripts/browser-coverage/test.js -c cache -t test/index.js
    $ node_modules/istanbul/lib/cli.js report --dir cache/coverage/browser --root cache/coverage/browser lcov
    You can then open coverage/browser/lcov-report/index.html in any browser to view the code coverage report

You can then enforce a certain level of code coverage, e.g.

    $ node_modules/istanbul/lib/cli.js check-coverage --lines 100 --function 100 --statements 100 --branches 100 cache/coverage/browser/coverage.json

You can also filter the tests, e.g.

    $ node_modules/gofur/scripts/browser-coverage/test.js -c cache -t test/index.js -g reg-ex


## Manually run tests in a browser

    $ node_modules/gofur/scripts/browser-coverage/serve.js -c cache -t test/index.js
    Use any browser to visit http://127.0.0.1:8001/index.html
    And you can filter the tests, e.g. http://127.0.0.1:8001/index.html?grep=reg-ex


## Run tests in a browser without generating code coverage

Headless with Chrome (you must have Chrome installed):

    $ node_modules/gofur/scripts/browser/test.js -c cache -t test/index.js

You can also filter the tests, e.g.

    $ node_modules/gofur/scripts/browser/test.js -c cache -t test/index.js -g reg-ex

Chrome:

    $ node_modules/gofur/scripts/browser/test.js -c cache -t test/index.js -b selenium:chrome

Firefox:

Note: you must have Firefox installed

    $ node_modules/gofur/scripts/browser/test.js -c cache -t test/index.js -b selenium:firefox


## Example

See [js-seed](https://github.com/redgeoff/js-seed) for a complete working example


## TODO: Run Saucelabs Tests In a Specific Browser

## Notes

As per https://github.com/domenic/chai-as-promised/releases/tag/v7.0.0, chai-as-promised 7 isn't supported by PhantomJS 2.1.14. Hopefully a later version of PhantomJS will support it or we'll need to transpile chais-as-promised

## Misc

A hacky way to debug the browser tests is to use print statements in the form `window.results.failures.push({ title: 'my msg' });`
