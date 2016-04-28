/**
 * Created by denman on 12/28/15.
 */

//#core
const util = require('util');

//#npm
const colors = require('colors/safe');

//#project
const constants = require('../config/suman-constants');


function handleExit(suman, testErrors, errors) {


    /*

     process.on('beforeExit',function(){

     console.log('before-exit');
     });

     /*process.on('uncaughtException',function(exc){

     process.stdout.write('uncaughtException3:',exc.stack);
     });

     */

    testErrors.forEach(function (te) {
        delete te.should;
        delete te['get should'];
        delete te['set should'];
    });

    errors.forEach(function (te) {
        delete te.should;
        delete te['get should'];
        delete te['set should'];
    });


    process.on('exit', function (code) {


        if (process.argv.indexOf('--runner') < 0 && process.argv.indexOf('--rnr') < 0) {
            global._writeError('\n\n<<< Suman end run <<<\n\n\n\n\n\n\n\n\n');
        }

        var message = null;

        if (errors.length > 0) {
            code = code || constants.EXIT_CODES.UNEXPECTED_NON_FATAL_ERROR;
            //message = 'Unexpected non-fatal errors present, errors: ' + util.inspect(errors);
        }
        else if (testErrors.length > 0) {
            code = code || constants.EXIT_CODES.TEST_CASE_FAIL;
            //message = 'Test case errors present, errors: ' + util.inspect(testErrors);
        }
        else {
            //message = 'No errors present, exiting with code =' + code;
        }

        //console.log(message);


        if (code > 0 && testErrors.length < 1) {   //TODO: fix this with logic saying if code > 0 and code < 60 or something
            if (!process.send) { //TODO: need to fix this
                process.stdout.write(colors.yellow('\n => Suman test process experienced an error during the run, most likely most tests if not all tests were not run.') + '\n');
            }
        }

        if (global.checkTestErrorLog) {
            process.stdout.write(colors.yellow('\n => You have some extraneous errors - check test error log for extra error information.') + '\n');
        }

        var m = {
            heapTotal: global.maxMem.heapTotal / 1000000,
            heapUsed: global.maxMem.heapUsed / 1000000
        };


        //TODO: perhaps we cannot rely on async IPC - send messages to parent process when child process is going to exit
        // perhaps there is a more reliable event that we can listen to

        if (process.send) {
            if (suman.config.checkMemoryUsage) {
                process.send({
                    msg: m,
                    type: constants.runner_message_type.MAX_MEMORY
                });
            }
        }
        else {
            var extra = '';
            if (code > 0) {
                extra = ' > see http://oresoftware.github.io/suman/exit-codes';
            }
            console.log('\n\n => Suman is exiting with code ' + code + ' ', extra, '\n');
        }


        process.exit(code);

        // setImmediate(function(){  //TODO: will this work?
        //     process.exit(code);
        // });

    });

}


module.exports = handleExit;