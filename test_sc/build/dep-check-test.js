/**
 * Created by amills001c on 10/7/15.
 */


//core
var assert = require('assert');
var debug = require('debug')('mocha');


describe('@Test_Dep_Check*', function () {


    it('no dependencies expected to be unreferenced in package.json', function (done) {

        var ndc = require('nodejs-dep-check');

        var result = ndc.run({
            verbose: false,
            ignoreModules: ['colors/safe'],
            ignorePaths: [
                'bin/pm2.js',
                'doc',
                'gulpfile.js',
                'node_modules',
                'public',
                'scripts',
                'test'
            ]
        });

        done(result);

    });


});
