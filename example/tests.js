'use strict';

var chai = require('chai');
chai.use(require('chai-as-promised'));
chai.should();

describe('foo', function () {

  it('should bar', function () {
    '1'.should.eql('1');
  });

});
