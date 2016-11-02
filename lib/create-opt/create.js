/**
 * Created by t_millal on 10/5/16.
 */


//core
const cp = require('child_process');
const path = require('path');
const os = require('os');
const url = require('url');
const fs = require('fs');

//npm
const async = require('async');
const sumanUtils = require('suman-utils/utils');

//project
const projectRoot = global.projectRoot || sumanUtils.findProjectRoot(process.cwd());


module.exports = function createTestFiles(paths) {

    const p = path.resolve(__dirname, '..', '..', 'default-conf-files/suman.skeleton.js');

    const strm = fs.createReadStream(p);

    async.each(paths, function (p, cb) {
        //TODO: difference between "finish" and "close" events on stream ??
        strm.pipe(fs.createWriteStream(p, {flags: 'wx'})).once('finish', function(){
            console.log(' => File was created:', p);
            process.nextTick(cb);
        }).once('error', function(err){
            console.error(err.stack || err);
            process.nextTick(cb);
        });

    }, function (err) {
        if (err) {
            console.error(err.stack || err);
            process.exit(1);
        }
        else {
            console.log(' => Suman message => successfully created test skeletons.');
            process.exit(0);
        }
    });


};