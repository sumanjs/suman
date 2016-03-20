/**
 * Created by denman on 12/28/15.
 */


const debug = require('debug')('suman:core');
const util = require('util');


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

        if (code > 0) {
            if (!process.send) {
                process.stdout.write('\nSuman test process experienced a fatal error during the run, most likely most tests if not all tests were not run.\n\n');
            }
        }

        var exitCode = null;
        var message = null;

        if (testErrors.length > 0 || errors.length > 0) {
            exitCode = 1;
            message = 'errors present, exiting with code 1, errors: ' + JSON.stringify(errors) + ', testErrors: ' + JSON.stringify(testErrors);
        }
        else {
            exitCode = 0;
            message = 'no errors present, exiting with code 0';
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
            console.error('About to send exit message to parent process.');
            //process.send({exitCode: 0, errors: errors, testErrors: testErrors, type: 'exit'});
        }

        if (suman.config.checkMemoryUsage) {
            debug('max memory X:' + m);
        }

        process.exit(exitCode);

    });


}


module.exports = handleExit;