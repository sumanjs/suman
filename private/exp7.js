#!/usr/bin/env node --harmony --debug


function foo(){

    let fn;

    function zoom(fn2){
         fn = fn2;
    }

    process.nextTick(function(){
         fn();
    });

    return zoom;

}


const fn = foo();

fn(function(){
     console.log('ram');
});
