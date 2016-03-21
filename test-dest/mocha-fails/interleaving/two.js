'use strict';

describe('suite two', function () {

    it('test', function (done) {

        setTimeout(function () {

            console.log(state);
            state.push(5);
            console.log(state);

            done();
        }, 1000);
    });
});