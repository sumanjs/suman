/**
 * Created by amills001c on 12/1/15.
 */


var incr = require('./incrementer');

function makeParallelTestSet(suman){

    function ParallelTestSet() {
        this.testId = incr();
        this.tests = [];
        this.type = 'ParallelTestSet';
    }


    ParallelTestSet.prototype.it = function (desc, cb) {
        this.tests.push({
            testId: incr(),
            type: 'it-parallel',
            desc: desc,
            cb: cb,
            complete: false,
            timedOut: false,
            error: null
        });
        return this;
    };

    ParallelTestSet.prototype.log = function (data) {
        suman.log(data, this);
    };


    return ParallelTestSet;

}



module.exports = makeParallelTestSet;