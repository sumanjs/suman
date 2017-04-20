#!/usr/bin/env node

// const x = eval('{a:"b"; m:"j"}');
// console.log('g => ',x);
//
//
// const o = eval('(function self(){return {a:"b"}})()');
// console.log('k => ',o.a);
//
//
// const p = eval('(function self(){return {parallel:false,timeout:3000}})()');
// console.log(p);
//
//

//polyfills
const process = require('suman-browser-polyfills/modules/process');
const global = require('suman-browser-polyfills/modules/global');

const patch = require('../../../lib/patches/all-ts');


process.on('uncaughtException', function(err){
  console.log(' This is uncaught => ', err);
});


const domain = require('domain');

const d = domain.create();

d.on('error', function(err){
  console.error(' => Domain caught => ',err);
});


d.run(function(){

  new Promise(function(resolve,reject){

    setTimeout(function(){

      Promise.resolve().then(function(){
        process.nextTick(function(){
          setTimeout(function(){
            throw new Error('rah'); // <<<<<<<<
          }, 100);

        });
      });
    }, 100);

  });

});
