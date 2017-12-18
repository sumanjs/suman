#!/usr/bin/env node

// (async function(){
//
//   let z= await 5;
//   console.log('z => ',z);
//
// })();



Object.keys({a:'b','c':'cr'}).forEach(function(k){
  console.log('k => ', k);
  throw 'boo';
});
