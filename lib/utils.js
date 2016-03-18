/**
 * Created by denman on 2/7/2016.
 */



//#core
const fs = require('fs');
const path = require('path');

//#npm
const residence = require('residence');
const _ = require('lodash');

/////////////////////////////////////////////////////////////////////////////////////

module.exports = {

    checkForValInStr: function (str, regex) {   //used primarily to check if 'done' literal is in fn.toString()
        return ((String(str).match(regex) || []).length > 1);
    },


    isArrowFunction: function (fn) { //TODO this will not work for async functions! 
        return fn.toString().indexOf('function') !== 0;
    },

    getStringArrayOfArgLiterals: function (fn) {
        // if function(a,b,c){}  ---> return ['a','b','c']
    },

    getHomeDir: function () {
        return process.env[(process.platform === 'win32' ? 'USERPROFILE' : 'HOME')];
    },

    findProjectRoot: residence.findProjectRoot,  // reference residence version for this call

    once: function sumanOnce(ctx, fn) {

        var callable = true;

        return function () {
            if (callable) {
                callable = false;
                fn.apply(ctx, arguments);
            }
            else {
                console.log(' => Suman warning => function was called more than once -' + fn.toString());
            }

        }
    },

    checkForEquality: function checkForArrayOfStringsEquality(arr1, arr2) {

        if (arr1.length !== arr2.length) {
            return false;
        }

        arr1 = arr1.sort();
        arr2 = arr2.sort();

        for (var i = 0; i < arr1.length; i++) {
            if (String(arr1[i]) !== String(arr2[i])) {
                return false;
            }
        }

        return true;
    },

    arrayHasDuplicates: function arrayHasDuplicates(a) {
        return _.uniq(a).length !== a.length;
    }

};


