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
                    fs.appendFileSync(global.testStderrStrmPath, typeof e === 'string' ? e : util.inspect(e), {flags: 'a'});
                }
                else {
                    fs.appendFileSync(global.testStderrStrmPath, typeof e === 'string' ? e : util.inspect(e), {flags: 'a'});
                }
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

        if (!global.usingRunner) {
            //global._writeError('\n\n<<< Suman end run <<<\n\n\n\n\n\n\n\n\n');
            // global.testStderrStrm.flush();
            fs.appendFileSync(global.testStderrStrmPath, '\n\n ### Suman end run ### \n\n\n\n\n\n\n\n\n');
        }

        //console.log(message);


        if (code > 0 && testErrors.length < 1) {   //TODO: fix this with logic saying if code > 0 and code < 60 or something
            if (!global.usingRunner) { //TODO: need to fix this
                process.stdout.write(colors.yellow('\n => Suman test process experienced an error during the run, most likely most tests if not all tests were not run.') + '\n');
            }
        }

        if (global.checkTestErrorLog) {
            process.stdout.write(colors.yellow('\n => You have some extraneous errors - check test error log for extra error information.') + '\n');
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

        debugger;
        process.exit(code);
        
    });

}


module.exports = handleExit;