'use strict';

var chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

var Foo = require('../example/foo');

describe('example', function () {

  it('should bar', function () {
    var foo = new Foo();
    return foo.bar().then(function (thing) {
      thing.should.eql('yar');
    });
  });

});
