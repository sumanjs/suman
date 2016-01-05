/**
 * Created by amills001c on 1/4/16.
 */


var makeTemp = require('./finalize-output');


function handleExit(suman, testErrors, errors) {

    process.on('uncaughtException', function (exc) {


        if(suman.ctx && suman.ctx.currentCtx){

            var fn;
            if(fn = suman.ctx.currentCtx.fn){
                if(exc instanceof Error){
                    fn(null,exc);
                }
                else{
                    throw new Error(exc);
                }
            }
        }
        else{
            console.error(exc.stack);
            process.exit(1);
        }

    });


}


module.exports = handleExit;