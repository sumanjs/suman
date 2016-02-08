/**
 * Created by denman on 1/2/2016.
 */

var SumanErrors = require('../config/suman-errors');


module.exports = function (suman) {


    return {


        handleExtraOpts: function handleExtraOpts(desc, opts, cb) {

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

        },

        handleOptsWithDeps: function handleOptsWithDeps(desc, opts, deps, cb) {

            if (typeof desc !== 'string') {
                SumanErrors.badArgs(suman, true, new Error('Need a description for the test suite.'));
            }
            else if (typeof opts === 'function') {

                if (deps || cb) {
                    SumanErrors.badArgs(suman, true, new Error('too many/too weird arguments'));
                }
                else {
                    cb = opts;
                    opts = {};
                    deps = [];
                }
            }
            else if (typeof deps === 'function') {

                if (cb) {
                    SumanErrors.badArgs(suman, true, new Error('too many/too weird arguments'));
                }
                else {
                    cb = deps;
                    deps = [];
                    if (typeof opts !== 'object') {
                        SumanErrors.badArgs(suman, true, new Error('too many/too weird arguments'));
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
                if (!Array.isArray(deps)) {
                    SumanErrors.badArgs(suman, true, new Error('deps is not an array.'));
                }
                if (typeof cb !== 'function') {
                    SumanErrors.badArgs(suman, true, new Error('cb is not a function'));
                }

            }


            return {
                desc: desc,
                opts: opts,
                deps: deps,
                cb: cb
            }

        }


    };


};