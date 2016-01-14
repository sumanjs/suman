/**
 * Created by denman on 1/2/2016.
 */

var SumanErrors = require('../config/suman-errors');


module.exports = function (suman) {


    return function handleExtraOpts(desc, opts, cb) {

        if (typeof desc === 'function') {
            if (opts || cb) {
                SumanErrors.badArgs(suman, true, new Error('too many/too weird arguments'));
            }
            else {
                cb = desc;
                desc = '(no description)';
                opts = {};
            }
        }
        else if (typeof opts === 'function') {
            if (cb) {
                SumanErrors.badArgs(suman, true, new Error('too many/too weird arguments'));
            }
            else {
                cb = opts;

                if (typeof desc === 'object') {
                    opts = desc;
                    desc = '(no description)'
                }
                else if (typeof desc === 'string') {
                    opts = {};
                }
                else {
                    SumanErrors.badArgs(suman, true, new Error('desc arg has an unexpected format'));
                }
            }

        }
        else {
            if (typeof desc !== 'string') {
                SumanErrors.badArgs(suman, true, new Error('desc is not a string'));
            }
            if (typeof opts !== 'object') {
                SumanErrors.badArgs(suman, true, new Error('opts is not an object'));
            }
            if (typeof cb !== 'function') {
                SumanErrors.badArgs(suman, true, new Error('cb is not a function'));
            }
        }


        return {
            desc: desc,
            opts: opts,
            cb: cb
        }

    }
};