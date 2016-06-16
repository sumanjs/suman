/**
 * Created by amills on 6/14/16.
 */


const EE = require('events');
const async = require('async');
global.sumanSingleProcEvents = new EE();


function run(files) {


    async.eachSeries(files, function (f, cb) {

        require(f)
            .on('suman-test-file-complete', cb)
            .on('test', function (test) {
                test.apply(null);
            });

    }, function (err, results) {

        console.log('\n\nVeERY MUCH COMPLETE => time required', Date.now() - global.sumanSingleProcessStartTime);
        process.exit(0);

    });


}


module.exports = run;

