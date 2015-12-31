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
var makeTemp = require('./make-temp');
var appRootPath = require('app-root-path');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var cp = require('child_process');


function Suman(obj) {
    this.outputPath = obj.outputPath;
    this.usingRunner = obj.usingRunner;
    this.config = obj.config;
    this.timestamp = obj.timestamp;
}

Suman.prototype.log = function (data, test) {
    var json = JSON.stringify({
        userOutput: true,
        testId: test.testId,
        desc: test.desc,
        data: data
    });

    fs.appendFileSync(this.outputPath, json += ',');
};

Suman.prototype.logErrors = function (test) {

    test.error = test.error || null;

    var obj = {};

    //console.log('test:', test);

    Object.keys(test).forEach(function (key) {

        var val = test[key];
        if (Array.isArray(val)) {
            if (val.length > 0) {
                obj[key] = val;
            }
        }
        else {
            obj[key] = val;
        }
    });

    //console.log('obj:', obj);

    var json = JSON.stringify(obj);
    fs.appendFileSync(this.outputPath, json += ',');

};


function makeSuman($module, configPath) {


    var args = _.map(process.argv, _.clone);

    var usingRunner = false;
    if (process.argv.indexOf('--runner') > -1) { //does our flag exist?
        usingRunner = true;
    }

    var config;
    var temp;
    try{
        temp = path.resolve(path.normalize(appRootPath + '/' + configPath));
        config = require(temp);
    }
    catch(err){
        console.log('could not resolve path to config file:', temp);
    }

    var outputDir = config.outputDir;

    var timestamp = null;
    if (usingRunner) {
        timestamp = process.argv[process.argv.indexOf('--ts') + 1];
        if (!timestamp) {
            throw new Error('no timestamp provided by Suman test runner');
        }
    }
    else {
        try {
            timestamp = Date.now();
            fs.mkdirSync(path.resolve(appRootPath + '/' + outputDir + '/' + String(timestamp)));
        }
        catch (err) {
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

    return new Suman({
        outputPath: outputPath,
        config: config,
        timestamp: timestamp,
        usingRunner: usingRunner
    });

}


var Runner = function (obj) {

    var $NODE_ENV = obj.$node_env;
    var fileOrDir = obj.fileOrDir;
    var configPath = obj.configPath;

    var runnerPath = path.resolve(__dirname + '/runner');

    return cp.fork(runnerPath, ['--pth', fileOrDir, '--cfg', configPath], {
        detached: false,
        env: {
            NODE_ENV: $NODE_ENV || process.env.NODE_ENV
        }
    });

};


var Server = function (obj) {

    obj = obj || {};
    var $NODE_ENV = obj.$node_env;

    var serverPath = path.resolve(__dirname + '/../bin/www');

    return cp.fork(serverPath, [], {
        detached: false,
        env: {
            NODE_ENV: $NODE_ENV || process.env.NODE_ENV
        }
    });

};


/*var given = function (cb1) {

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
 };*/


module.exports = {
    //given: given

    //new: function ($module, configPath) {
    //
    //    var suman = makeSuman($module, configPath);
    //
    //    return {
    //
    //        suite: require('./run').main(suman)
    //    }
    //
    //},



    Test: function Test($module, configPath) {

        if (this instanceof Test) {
            console.log('warning: no need to use "new" keyword with Test constructor');
            return Test($module, configPath);
        }

        var yolo = {
            cookie:'monster'
        };
        return {

            new: function (desc, cb) {

                var suman = makeSuman($module, configPath);
                var run = require('./run').main(suman);
                run(desc, cb);

            }
        }

    },

    Runner: Runner,
    Server: Server

};

