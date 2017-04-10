#!/bin/bash
exec mocha --reporter=tap --output=foo <(sed -n '/^#MOCHA_START#/,$ p' "$0")
#MOCHA_START#

const util = require('util');
console.log(util.inspect(process.env));

describe('a', function(){

  it('tests', function(){

  });

});
