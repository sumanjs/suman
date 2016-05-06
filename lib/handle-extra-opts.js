/**
 * Created by denman on 1/2/2016.
 */

var SumanErrors = require('../config/suman-errors');


module.exports = function (suman) {


    return {

        handleOptionalDesc: function handleOptionalDesc(desc, fn) {
            var obj = {};
            if (typeof desc === 'function') {
                obj.fn = desc;
                obj.desc = null;
            }
            else if (typeof desc === 'string') {
                if (typeof fn !== 'function') {
                    throw new Error('fn is not a function');
                }
                obj.fn = fn;
                obj.desc = desc;
            }
            else {
                throw new Error('Bad arguments to before/after/beforeEach/afterEach');
            }

            return obj;
        },

        handleExtraTestCaseOpts: function handleExtraOpts(desc, opts, cb) {

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
                //TODO: commenting out to make way for stubbed tests
                opts = opts || {};

            }

            return {
                desc: desc,
                opts: opts,
                cb: cb
            }

        },


        //TODO: create handler that forces description to exist
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

        //TODO: we will never need dep array, so can do away with this fn
        handleOptsWithExtraAndWritable: function handleOptsWithExtraAndWritable(desc, opts, cb, extra, writable, ioc) {

            if (typeof desc !== 'string') {
                SumanErrors.badArgs(suman, true, new Error('Need a description for the test suite.'));
            }
            else if (typeof opts === 'function') {

                ioc = writable;
                writable = extra;
                extra = cb;
                cb = opts;
                opts = {};

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
                cb: cb,
                extra: extra,
                writable: writable,
                ioc: ioc || {}   // this needs to be fixed
            }
        }
    };

};