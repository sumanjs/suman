/**
 * Created by amills on 6/14/16.
 */


const EE = require('events');
const async = require('async');
global.sumanSingleProcEvents = new EE();

function run(files) {

    async.eachSeries(files, function (f, cb) {

        const fullPath = f[0];
        const shortenedPath = f[1];

        debugger;

        require(fullPath)
            .once('suman-test-file-complete', function () {
                cb(null);
            })
            .once('test', function (test) {
                console.log('\n\n', ' => Suman is now running test with filename => [' + shortenedPath + ']');
                test.apply(null);
            })
            .once('error', function (e) {
                console.log(e.stack || e);
                cb(e);
            })

    },
        function (err, results) {

        if(err){
            console.error(err.stack || err);
            process.exit(1);
        }
        else{
            console.log('\n\n => Suman message => SUMAN_SINGLE_PROCESS run is now complete =>\n\n' +
                ' => time required', Date.now() - global.sumanSingleProcessStartTime);

            process.exit(0);
        }

    });

}

module.exports = run;

