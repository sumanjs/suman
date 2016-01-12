/**
 * Created by amills001c on 12/16/15.
 */


var path = require('path');

//#config
var config = require('univ-config')(module, '*suman*', 'server/config/conf');

//#core
var express = require('express');
var router = express.Router();
var path = require('path');
var appRootPath = require('app-root-path');
var fs = require('fs');

//#helpers
var helpers = require('./helpers');


router.post('/done/:run_id', function (req, res, next) {

    var data = body.data;

    try {
        var json = JSON.stringify(data.test);

        if (data.outputPath) {
            fs.appendFile(data.outputPath, json += ',', function (err) {
                if (err) {
                    next(err);
                }
                else {
                    req.sumanData.success = {msg: 'appended data to ' + data.outputPath};
                    next();
                }
            });
        }
    }
    catch (err) {
        next(err);
    }


});

router.post('/make/new', function (req, res, next) {

    var body = req.body;
    var config = body.config;
    var timestamp = body.timestamp;

    try {
        var outputDir = config.output.web.outputDir;
        var outputPath = path.resolve(appRootPath + '/' + outputDir + '/' + timestamp);
        fs.mkdir(outputPath, function (err) {
            if (err) {
                next(err);
            }
            else {
                req.sumanData.success = {msg: 'created dir at ' + outputPath};
                next();
            }

        });
    }
    catch (err) {
        next(err);
    }
});


router.get('/latest', function (req, res, next) {

    console.log('in latest');

    var folder = path.resolve(appRootPath.path, 'results');

    console.log('folder:', folder);

    var runId = helpers.getPathOfMostRecentSubdir(folder);

    if (runId) {
        var file = path.resolve(appRootPath.path, 'results', runId, 'temp.html');
        console.log('***:', file);
        res.sendFile(file);
    }
    else {
        next(new Error('no latest results exist'));
    }

});

router.get('/:run_id/:test_num', function (req, res, next) {

    console.log('in runid/testnum');

    var runId = req.params.run_id;
    var testNum = req.params.test_num;

    res.sendFile(path.resolve(appRootPath.path, 'results', runId, testNum), {
        maxAge: '58h'
    });

});

router.get('/:run_id', function (req, res, next) {

    console.log('in runid only');

    var runId = req.params.run_id;

    var file = path.resolve(appRootPath.path, 'results', runId, 'temp.html');
    console.log(file);
    res.sendFile(file);

});


//router.get('/:run_id/:test_num',function(req,res,next){
//
//    var runId = req.params.run_id;
//    var testNum = req.params.test_num;
//
//    res.sendFile(path.resolve('results',runId,testNum));
//
//});


module.exports = router;