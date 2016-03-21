/**
 * Created by denman on 3/17/2016.
 */


const assert = require('assert');
const _ = require('lodash');
const sumanUtils = require('../utils');

module.exports = order => {

    try {
        order = JSON.parse(JSON.stringify(order));
    }
    catch (err) {
        throw new Error(' => Suman fatal error => Suman could not parse your suman.order.js exported object.');
    }

    assert(typeof order === 'object', ' => Suman fatal error => your suman.order.js file does not export a function that returns an object.');
    const keys = Object.keys(order);

    Object.keys(order).forEach(function (key, index) {
        const val = order[key];
        assert(typeof val.testPath === 'string' && val.testPath.length > 0, ' => Suman fatal error => invalid testPath at key = "' + key + '" in your suman.order.js file.');
        if (val.obstructs) {
            assert(Array.isArray(val.obstructs), '=> Suman fatal error => invalid obstructs value at key = "' + key + '" in your suman.order.js file.');

            if (sumanUtils.arrayHasDuplicates(val.obstructs)) {
                throw new Error(' => Suman fatal error => obstructs array in suman.order.js belonging to key = "' + key + '" contains duplicate values.');
            }

            val.obstructs.forEach(function ($key) {
                if (String(key) === String($key)) {
                    throw new Error(' => Suman fatal error => suman.order.js has a key = "' + key + '" that will obstruct itself from running.');
                }

                if (!_.includes(keys, String($key))) {
                    throw new Error(' => Suman fatal error => Key given by value = "' + $key + '" was not present in your suman.order.js file.');
                }
            });
        }
        else {
            val.obstructs = [];  //assign the array for ease of use later
        }


    });

}