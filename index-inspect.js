#!/usr/bin/env node --inspect --debug-brk --harmony
process.env.SUMAN_EXTRANEOUS_EXECUTABLE = 'yes';
//require index explicitly, do *not* do require('.') because that will look-up package.json.main
require('./index');