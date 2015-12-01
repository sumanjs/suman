/**
 * Created by amills001c on 12/1/15.
 */



var inc = require('./incrementer');

function makeLoopTestSet(log){

    function LoopTestSet() {
        this.testId = inc();
        this.tests = [];
        this.type = 'LoopTestSet';
    }

    LoopTestSet.prototype.it = function (desc, cb) {
        this.tests.push({
            testId: inc(),
            type: 'it-loop',
            desc: desc,
            cb: cb,
            timedOut: false,
            complete: false,
            error: null
        });
        return this;
    };

    LoopTestSet.prototype.log = function (data) {
        log(data, this);
    };

    return LoopTestSet;

}


module.exports = makeLoopTestSet;