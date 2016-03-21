'use strict';

/**
 * Created by amills001c on 3/16/16.
 */

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