/**
 * Created by amills001c on 12/28/15.
 */



function handleExit(suman, testErrors, errors) {


    process.on('beforeExit',function(){

        console.log('before-exit');
    });


    process.on('exit', function () {

        //process.stdin.resume();
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
            heapTotal: suman.maxMem.heapTotal/1000000,
            heapUsed: suman.maxMem.heapUsed/1000000
        };

        if (suman.usingRunner) {
            process.send({msg: m, type: 'MAX_MEMORY'});
            process.send({exitCode: 0, errors: errors, testErrors: testErrors, type: 'exit'});
        }

        process.exit(exitCode);

    });


}


module.exports = handleExit;