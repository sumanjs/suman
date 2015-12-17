

/**
 * Created by amills001c on 12/16/15.
 */


//config
var config = require('univ-config')('*suman*', 'config/conf');

//core
var express = require('express');
var router = express.Router();
var path = require('path');

var helpers = require('./helpers');



router.get('/latest',function(req,res,next){

    console.log('in latest');

    var runId = helpers.getPathOfMostRecentSubdir('/results');

    if(runId){
        res.sendFile(path.resolve('results',runId,'temp.html'));
    }
    else{
        next(new Error('no latest results exist'));
    }

});

router.get('/:run_id',function(req,res,next){

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


router.get('/results/:run_id/:test_num',function(req,res,next){

    var runId = req.params.run_id;
    var testNum = req.params.test_num;

    res.sendFile(path.resolve('results',runId,testNum),{
        maxAge:'58h'
    });

});


module.exports = router;