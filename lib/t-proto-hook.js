/**
 * Created by Olegzandr on 5/12/16.
 */

const proto = require('./t-proto');


function T(fini, handleError) {
    this.__fini = fini;
    this.__handle = handleError;
}

T.prototype = Object.create(proto);


T.prototype.done = function done(err) {
    if (err) {
        err.sumanFatal = global.sumanOpts.bail ? true : false;
    }
    this.__fini(err);
};


T.prototype.ctn = function ctn() {
    this.__fini(null);   //TODO: use spread operator here?
};


T.prototype.fatal = function fatal(err) {
    err = err instanceof err ? err : new Error('Suman placeholder error since user did not explicitly provide one.');
    err.sumanFatal = true;
    this.__fini(err);
};


module.exports = T;