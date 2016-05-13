/**
 * Created by Olegzandr on 5/12/16.
 */


const proto = require('./t-proto');

function T(handleError) {
    this.__handle = handleError;
}

T.prototype = Object.create(proto);


//TODO: add warnings if callbacks are invoked when callback mode is not explicitly set



module.exports = T;