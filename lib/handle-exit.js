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

    process.on('exit', function (code) {


        var message = null;

        if (errors.length > 0) {
            code = constants.EXIT_CODES.UNEXPECTED_NON_FATAL_ERROR;
            message = 'Unexpected non-fatal errors present, errors: ' + JSON.stringify(errors);
        }
        else if (testErrors.length > 0) {
            code = constants.EXIT_CODES.TEST_CASE_FAIL;
            message = 'Test case errors present, errors: ' + JSON.stringify(testErrors);
        }
        else {
            message = 'No errors present, exiting with code =' + code;
        }

        // console.log(message);

        if (code > 0) {   //TODO: fix this with logic saying if code > 0 and code < 60 or something
            if (!process.send) { //TODO: need to fix this
                process.stdout.write(colors.yellow('\n => Suman test process experienced a fatal error during the run, most likely most tests if not all tests were not run.') + '\n');
            }
        }


        var m = {
            heapTotal: suman.maxMem.heapTotal / 1000000,
            heapUsed: suman.maxMem.heapUsed / 1000000
        };


        //TODO: perhaps we cannot rely on async IPC - send messages to parent process when child process is going to exit
        // perhaps there is a more reliable event that we can listen to

        if (process.send) {
            if (suman.config.checkMemoryUsage) {
                process.send({msg: m, type: 'MAX_MEMORY'});
            }
            console.log({exitCode: 0, errors: errors, testErrors: testErrors, type: 'exit'});
        }

        console.log('\n\n => Suman is exiting with code ' + code + '\n');
        process.exit(code);

    });


}


module.exports = handleExit;