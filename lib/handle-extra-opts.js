'use strict';


module.exports = Object.freeze({

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

    handleExtraTestCaseOpts: function handleExtraOpts(desc, opts, fn) {

        if (typeof desc === 'function') {
            if (opts || fn) {
                throw  new Error('too many/too weird arguments');
            }
            else {
                fn = desc;
                desc = '(no description)';
                opts = {};
            }
        }
        else if (typeof opts === 'function') {
            if (fn) {
                throw  new Error('too many/too weird arguments')
            }
            else {
                fn = opts;

                if (typeof desc === 'object') {
                    opts = desc;
                    desc = '(no description)'
                }
                else if (typeof desc === 'string') {
                    opts = {};
                }
                else {
                    throw new Error('desc arg has an unexpected format');
                }
            }

        }
        else {
            if (typeof desc !== 'string') {
                throw new Error('desc is not a string');
            }
            //TODO: commenting out to make way for stubbed tests
            opts = opts || {};

        }

        return {
            desc: desc,
            opts: opts,
            fn: fn
        }

    },


    //TODO: create handler that forces description to exist
    handleExtraOpts: function handleExtraOpts(desc, opts, cb) {

        if (typeof desc === 'function') {
            if (opts || cb) {
                throw new Error('too many/too weird arguments');
            }
            else {
                cb = desc;
                desc = '(no description)';
                opts = {};
            }
        }
        else if (typeof opts === 'function') {
            if (cb) {
                throw new Error('too many/too weird arguments');
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
                    throw new Error('desc arg has an unexpected format');
                }
            }

        }
        else {
            if (typeof desc !== 'string') {
                throw new Error('desc is not a string');
            }
            if (typeof opts !== 'object') {
                throw new Error('opts is not an object');
            }
            if (typeof cb !== 'function') {
                throw new Error('cb is not a function');
            }
        }


        return {
            desc: desc,
            opts: opts,
            cb: cb,
            fn: cb  //TODO: remove duplicate
        }

    }
});
