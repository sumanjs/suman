#!/usr/bin/env babel-node --presets stage-3
process.env.SUMAN_EXTRANEOUS_EXECUTABLE = 'yes';
//require index explicitly, do *not* do require('.') because that will look-up package.json.main
require('./index'); //require index