/**
 * Created by amills001c on 2/9/16.
 */

"use strict";

let doSomethingAsync = function () {
    var ref = _asyncToGenerator(function* () {
        return yield timeout();
    });

    return function doSomethingAsync() {
        return ref.apply(this, arguments);
    };
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function timeout(charlie) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(charlie || 'yikes');
        }, 100);
    });
}

var val = doSomethingAsync();

console.log(val);

val.then(function (vl) {
    console.log(vl);
});