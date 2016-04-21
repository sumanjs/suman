'use strict';

/**
 * Created by denman on 2/11/2016.
 */

//this module is for testing this library

module.exports = function () {

    return {
        prop1: 1,
        prop2: {
            foo: 'bar'
        },
        prop3: {
            jungle: function jungle() {
                return 'book';
            }
        }

    };
};