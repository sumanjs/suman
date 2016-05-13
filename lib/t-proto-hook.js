/**
 * Created by Olegzandr on 5/12/16.
 */

const proto = require('./t-proto');


function T(handleError) {
    this.__handle = handleError;
}

T.prototype = Object.create(proto);




module.exports = T;