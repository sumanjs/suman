/**
 * Created by Olegzandr on 5/12/16.
 */


const proto = require('./t-proto');

function T(fini, handleError) {
    this.__fini = fini;
    this.__handle = handleError;
}

T.prototype = Object.create(proto);


//TODO: add warnings if callbacks are invoked when callback mode is not explicitly set

T.prototype.done = function done(err) {
    if (err) {
        err.sumanFatal = global.sumanOpts.bail ? true : false;
    }
    this.__fini(err);
};


T.prototype.pass = function pass() {
    this.__fini(null);
};


T.prototype.fail = function fail(err) {
    err = err || new Error('fail() was called on test; note that null/undefined value was passed as first arg to the fail function.');
    err.sumanFatal = global.sumanOpts.bail ? true : false;
    this.__fini(err);
};


T.prototype.fatal = function fatal(err) {
    err = err || new Error('Temp error since user did not provide one.');
    err.sumanFatal = true;
    this.__fini(err);
};


module.exports = T;