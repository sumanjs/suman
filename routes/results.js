/**
 * Created by amills001c on 12/16/15.
 */


var path = require('path');

//#config
//var config = require('univ-config')('*suman*', path.resolve('./config/conf'));

//#core
var express = require('express');
var router = express.Router();
var path = require('path');
var appRoot = require('app-root-path');

//#helpers
var helpers = require('./helpers');


router.get('/latest', function (req, res, next) {

    console.log('in latest');

    var runId = helpers.getPathOfMostRecentSubdir('/results');

    if (runId) {
        res.sendFile(path.resolve('results', runId, 'temp.html'));
    }
    else {
        next(new Error('no latest results exist'));
    }

});

router.get('/:run_id/:test_num', function (req, res, next) {

    console.log('in runid/testnum');

    var runId = req.params.run_id;
    var testNum = req.params.test_num;

    res.sendFile(path.resolve('results', runId, testNum), {
        maxAge: '58h'
    });

});

router.get('/:run_id', function (req, res, next) {

    console.log('in runid only');

    var runId = req.params.run_id;
    res.sendFile(path.resolve('results',runId,'temp.html'));

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