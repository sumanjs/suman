/**
 * Created by denman on 1/1/2016.
 */


module.exports = function makeSuiteLite(suite){

    var obj = {
        after: suite.after,
        afterEach: suite.afterEach,
        before: suite.before,
        beforeEach: suite.beforeEach,
        loop: suite.loop,
        describe: suite.describe,
        it: suite.it,
        parallel: suite.parallel,
        log: suite.log,
        series: suite.series
    };

    for(var prop in obj){
        if(obj.hasOwnProperty(prop)){
            try{
                obj[prop] = obj[prop].bind(suite);
            }
            catch(err){
                console.error(err.stack);
            }
        }
    }

    return obj;


};