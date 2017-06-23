# gofur

Utils for running JS tests in the browser


## Run manually tests in a browser

    $ npm run browser-server
    Use browser to visit http://127.0.0.1:8001/index.html


## Run tests in phantomjs and generate code coverage

    $ npm run browser-coverage-full-test
    TODO: how to check coverage


## TODO: should all of the following be in the node-seed repo instead?

## TODO: Run all local tests

## TODO: Run single node test

## TODO: Run subset of tests and analyze coverage

## TODO: Debugging Tests Using Node Inspector

## TODO: Run Saucelabs Tests In a Specific Browser

## Notes

As per https://github.com/domenic/chai-as-promised/releases/tag/v7.0.0, chai-as-promised 7 isn't supported by PhantomJS 2.1.14. Hopefully a later version of PhantomJS will support it or we'll need to transpile chais-as-promised
