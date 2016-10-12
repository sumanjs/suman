/**
 * Created by t_millal on 10/11/16.
 */



//core
const assert = require('assert');
const path = require('path');
const util = require('util');

//npm
const async = require('async');
const colors = require('colors');

//project
const callbackOrPromise = require('./callback-or-promise');


module.exports = function (oncePostKeys, cb) {

    var called = false;

    function first() {
        if (!called) {
            called = true;
            const args = arguments;
            process.nextTick(function(){
                cb.apply(null, args);
            });
        }
        else {
            console.log.apply(console, arguments);
            console.log(' => Suman warning first() called more than once in ' + __filename);
        }
    }



    var oncePostModule,
        oncePostModuleRet,
        oncePosts = {},
        hasonlyPostKeys = oncePostKeys.length > 0;


    if (!hasonlyPostKeys) {
        return first();
    }


    try {
        oncePostModule = require(path.resolve(global.sumanHelperDirRoot + '/suman.once.post.js'));
    }
    catch (err) {
        console.error(' => Suman usage warning => you have suman.once.post defined, but no suman.once.post.js file.');
        console.error(err.stack);
        return first(err);
    }

    try {
        assert(typeof  oncePostModule === 'function', 'suman.once.post.js module does not export a function.');
        oncePostModuleRet = oncePostModule.apply(null, []);
    }
    catch (err) {
        console.log(' => Your suman.once.post.js file must export a function that returns an object.');
        console.error(err.stack);
        return first(err);
    }

    if (typeof oncePostModuleRet === 'object') {

        oncePostKeys.forEach(function (k) {
            //we store an integer for analysis/program verification, but only really need to store a boolean
            //for existing keys we increment by one, otherwise assign to 1
            oncePosts[k] = oncePosts[k] || oncePostModuleRet[k];


            if (typeof oncePosts[k] !== 'function') {

                console.log(' => Suman is about to conk out =>\n\n' +
                    ' => here is the contents return by the exported function in suman.once.post.js =>\n\n', oncePosts);

                throw new Error(' => Suman usage warning => your suman.once.post.js ' +
                    'has keys whose values are not functions,\n\nthis applies to key ="' + k + '"');

            }
        });

    }
    else {
        console.log(' => Your suman.once.post.js file must export a function that returns an object.');
        return first(null);
    }

    const keys = Object.keys(oncePosts);
    if (keys.length) {
        console.log('\n', ' => Suman message => Suman is now running the desired hooks in suman.once.post.js, which include => \n\t', colors.cyan(util.inspect(keys)));
    }
    else{
        return first(new Error('Your suman.once.post.js files is missing some keys present in your test file(s).'));
    }

    async.eachSeries(keys, function (k, cb) {

        callbackOrPromise(k, oncePosts, cb);

    }, function (err) {
        if (err) {
            console.error(err.stack || err);
            first(err);
        }
        else {
            console.log('\n\n', ' => Suman message => all suman.once.post.js hooks completed successfully...exiting...');
            first(null);
        }

    });


};