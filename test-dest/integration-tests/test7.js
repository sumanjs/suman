/**
 * Created by amills001c on 2/9/16.
 */

"use strict";

let main = function () {
    var ref = _asyncToGenerator(function* () {
        var quote = yield getQuote();
        console.log(quote);
    });

    return function main() {
        return ref.apply(this, arguments);
    };
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

var request = require('request');

function getQuote() {
    var quote;

    return new Promise(function (resolve, reject) {
        request('http://ron-swanson-quotes.herokuapp.com/v2/quotes', function (error, response, body) {
            quote = body;

            resolve(quote);
        });
    });
}

main();
console.log('Ron once said,');