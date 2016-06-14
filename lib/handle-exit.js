/**
 * Created by denman on 12/28/15.
 */

//#core
const util = require('util');
const fs = require('fs');

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
            code = code || constants.EXIT_CODES.UNEXPECTED_NON_FATAL_ERROR;
            errors.forEach(function (e) {
                if (global.usingRunner) {
                    process.stderr.write(typeof e === 'string' ? e : util.inspect(e));
                }
                global._writeTestError(typeof e === 'string' ? e : util.inspect(e));
            });

            //message = 'Unexpected non-fatal errors present, errors: ' + util.inspect(errors);
        }
        else if (testErrors.length > 0) {
            code = code || constants.EXIT_CODES.TEST_CASE_FAIL;
            //message = 'Test case errors present, errors: ' + util.inspect(testErrors);
        }
        else {
            //message = 'No errors present, exiting with code =' + code;
        }

        global._writeTestError('\n\n ### Suman end run ### \n\n\n\n', true);


        if (code > 0 && testErrors.length < 1) {   //TODO: fix this with logic saying if code > 0 and code < 60 or something
            if (!global.usingRunner) { //TODO: need to fix this
                process.stdout.write(colors.yellow('\n => Suman test process experienced a fatal error during the run, ' +
                        'most likely the majority of tests, if not all tests, were not run.') + '\n');
            }
        }

        if (global.checkTestErrorLog) {
            process.stdout.write(colors.yellow('\n => You have some additional errors/warnings - check the test debug log ' +
                    '(logs/test-debug.log) for more information.') + '\n');
        }


        if (global.usingRunner) {

            //TODO: need to add this somewhere where we can wait for the response from parent process before exiting
            if (global.sumanConfig.checkMemoryUsage) {

                var m = {
                    heapTotal: global.maxMem.heapTotal / 1000000,
                    heapUsed: global.maxMem.heapUsed / 1000000
                };

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

    });

}


module.exports = handleExit;