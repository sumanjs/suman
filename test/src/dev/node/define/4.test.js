#!/usr/bin/env node

const suman = require('suman');
const {Test} = suman.init(module);

Test.define(v => {
  console.log(v.valueOf());
});


