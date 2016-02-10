/**
 * Created by amills001c on 2/9/16.
 */

"use strict";


function timeout(charlie) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(charlie || 'yikes');
        }, 100);
    })
}


async function doSomethingAsync() {
    return await timeout();
}


var val = doSomethingAsync();

console.log(val);

val.then(function (vl) {
    console.log(vl);
});