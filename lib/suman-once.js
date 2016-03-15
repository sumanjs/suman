/**
 * Created by denman on 1/4/16.
 */



module.exports = function sumanOnce(fn,ctx){

    var callable = true;

    return function(){
        if(callable){
            callable = false;
            fn.apply(ctx,arguments);
        }
        else{
            throw new Error('function was called more than once -' + fn);
        }

    }

};