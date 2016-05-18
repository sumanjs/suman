

"use strict";

Object.freezeExistingProps = function(obj, modifyProto){

    Object.keys(obj).forEach(function(key){

        const val = obj[key];

        Object.defineProperty(obj, key , {  //we simply overwrite existing prop
            value: val,
            writable: false, // important, I think
            enumerable: true,
            configurable: false
        });


    });

    return obj;

};


var z = {
    foo: 'bar'
};

var k = Object.freezeExistingProps(z);

k.foo = 'mmmm';

console.log(z);
console.log(k);

