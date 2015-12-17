/**
 * Created by amills001c on 11/24/15.
 */


/* advantages of Suman
 *
 * better than mocha, cleaner than vows
 * no globals - no global NPM module - no global variables
 * test suites each run in separate process for speed and correctness
 * each test suite can have parallel components, allowing the developer to run tests serially, in parallel or in combination, as the developer sees fit
 * code inside any test will not run for any test not intended to run when using grep features
 * organize your tests depending on NODE_ENV or command line flags using config files, instead of putting tests in different top-level folders in your project
 *  asynchronous reporting capablities - write test results to DB
 *
 * */



//TODO: need to check to make sure the tests have different names, before running
//note: https://www.npmjs.com/package/gulp-mocha


//var Promise = require('bluebird');
var makeTemp = require('./lib/make-temp');
var appRootPath = require('app-root-path');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');



function makeSuman($module, configPath) {

    var args = _.map(process.argv, _.clone);

    var usingRunner = false;
    if (process.argv.indexOf('--runner') > -1) { //does our flag exist?
        usingRunner = true;
        console.log('test:',$module.filename,'is using runner');
    }
    else{
        console.log('test:',$module.filename,'is *not* using runner');
    }


    var config = require(path.resolve(appRootPath + '/' + configPath));
    var outputDir = config.outputDir;

    var timestamp = null;
    if(usingRunner){
        timestamp = process.argv[process.argv.indexOf('--ts') + 1];
        if(!timestamp){
            throw new Error('no timestamp provided by Suman test runner');
        }
    }
    else{
        try{
            timestamp = Date.now();
            fs.mkdirSync(path.resolve(appRootPath + '/' + outputDir + '/' + String(timestamp)));
        }
        catch(err){
            throw err;
        }
    }


    var outputPath = path.resolve(appRootPath + '/' + outputDir + '/' + timestamp + '/' + path.basename($module.filename, '.js') + '.txt');

    //var wstream = fs.createWriteStream(outputPath);

    try {
        var unlink = fs.unlinkSync(outputPath);
    }
    catch (err) {

    }

    var log = function (data, test) {
        var json = JSON.stringify({
            userOutput: true,
            testId: test.testId,
            desc: test.desc,
            data: data
        });

        fs.appendFileSync(outputPath, json += ',');
    };

    var logErrors = function (test) {

        test.error = test.error || null;

        var json = JSON.stringify(test);
        fs.appendFileSync(outputPath, json += ',');
    };


    return {

        suite: require('./lib/ntf').main(log, logErrors, config, timestamp),
        given: given

    }


}

makeSuman.Runner = require('./lib/runner');


var given = function (cb1) {

    var prom = cb1();

    return {
        when: function (cb2) {

            prom = prom.then(cb2);

            return {
                then: function (cb3) {

                    console.log(cb3);

                    //try {
                    //    //var promise = cb1();
                    //    //var promise = cb2();
                    //    //var promise = cb3();
                    //
                    prom.then(cb3);
                    //}
                    //catch (err) {
                    //    console.error(err);
                    //}

                    return this;
                }
            }

        }
    }
};


module.exports = makeSuman;

