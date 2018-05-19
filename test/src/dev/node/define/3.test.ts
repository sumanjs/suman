#!/usr/bin/env node
import suman, {s} from 'suman';
const Test = suman.init(module);

Test.define(v => {
  
  v.desc('hi')
  .run(function (b, it: s.ItFn) {
    
    it.parallel('hi', (t: s.TestCaseParam) => {
    
    });
    
  });
  
});

Test.define('hi')
.source('semver', 'suit')
.run(function (b) {
  
  const {it, describe} = b.getHooks();
  const sourced = b.getSourced();
  
  console.log('sourced:', sourced);
  
  it.parallel('hi', (t: s.TestCaseParam) => {
  
  });
  
  describe('published', b => {
    
    5..times(function () {
      
      it('meta', t => {
      
      });
      
    });
    
  });
  
});



