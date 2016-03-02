/**
 * Created by denman on 2/7/2016.
 */



//#core
const fs = require('fs');
const path = require('path');

//#npm
const residence = require('residence');

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

    getHomeDir: function(){
        return process.env[(process.platform === 'win32' ? 'USERPROFILE' : 'HOME')];
    },

    findProjectRoot: residence.findProjectRoot  // reference residence version for this call

};
