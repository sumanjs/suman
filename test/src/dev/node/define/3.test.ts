#!/usr/bin/env node

import suman, {s} from 'suman';
const Test = suman.init(module);

Test.define(v => {
  
  v.desc('hi')
  .run(function (b, it: s.ItFn) {
    
    it.parallel('hi', (t: s.ITestCaseParam) => {
    
    });
    
  });
  
});


