// const Threads = require('webworker-threads');
//
// var thread = Threads.create();
//
// const roodles = 3;
//
// thread.eval(function () {
//
//     console.log('roodles:', roodles);
// });
//


// console.log(Object.map);


Object.map = function(obj, fn){

    const ret = {};

    Object.keys(obj).forEach(function(key){
        ret[key] = fn.apply(null,[key]);
    });

    return ret;
};


const obj = {"a":5,"b":6};

const newObject = Object.map(obj, key => {
    return obj[key] + 5;
});

console.log(obj); // {"a":5,"b":6}
console.log(newObject); // {"a":10,"b":11}