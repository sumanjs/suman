/**
 * Created by amills001c on 12/1/15.
 */



var incr = require('./incrementer');

function makeLoopTestSet(suman){

    function LoopTestSet() {
        this.testId = incr();
        this.tests = [];
        this.type = 'LoopTestSet';
    }

    LoopTestSet.prototype.it = function (desc, cb) {
        this.tests.push({
            testId: incr(),
            type: 'it-loop',
            desc: desc,
            data: {},
            cb: cb,
            timedOut: false,
            complete: false,
            error: null
        });
        return this;
    };

    LoopTestSet.prototype.log = function (data) {
        suman.log(data, this);
    };

    return LoopTestSet;

}


module.exports = makeLoopTestSet;