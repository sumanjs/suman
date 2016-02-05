/**
 * Created by amills001c on 1/4/16.
 */


var called = false;


function handleExit() {

    if(called){
        return;
    }
    else{
        called = true;
    }


    process.on('uncaughtException', function (exc) {

        process.stderr.write('uncaughtException: ' + exc.stack);
        //process.stdout.write('uncaughtException: ' + exc.stack);

        //if(suman.ctx && suman.ctx.currentCtx){
        //
        //    var fn;
        //    if(fn = suman.ctx.currentCtx.fn){
        //        if(exc instanceof Error){
        //            fn(null,exc);
        //        }
        //        else{
        //            throw new Error(exc);
        //        }
        //    }
        //}
        //else{
        //    console.error(exc.stack);
        //    process.exit(1);
        //}

    });


}


module.exports = handleExit;