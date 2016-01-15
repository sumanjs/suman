/**
 * Created by amills001c on 1/12/16.
 */


var debug = require('debug')('suman');


describe('gggg', function () {

    beforeEach(function (done) {

        console.log('beforeEach'); done();;
    });

    after(function monkey(done) {

        throw new Error('charles');
        console.log('after'); done();;
    });

    after(function (done) {

        console.log('after'); done();;
    });

    describe('lageage',function () {

        after(function (done) {

            console.log('after'); done();;
        });

        beforeEach(function (done) {

            console.log('beforeEach'); done();;
        });


        describe('moodle', function () {

            after(function (done) {

                console.log('after'); done();;
            });

            beforeEach(function (done) {

                //throw new Error('yikies');
                console.log('beforeEach'); done();;
            });


            it('mmm1', function (done) {

                console.log('it'); done();;

            });

            it('mmm2',  function (done) {

                console.log('it'); done();;

            });

            it('mmm3',  function (done) {

                console.log('it'); done();;

            });

            beforeEach(function (done) {

                console.log('beforeEach'); done();;
            });

            afterEach(function (done) {

                console.log('afterEach'); done();;
            });


            after(function (done) {

                console.log('after'); done();;
            });


        });

        after(function (done) {

            console.log('after'); done();;
        });


    });

    before(function (done) {

        console.log('before'); done();;
    });

    it('7777',  function (done) {

        console.log('it'); done();;

    });

    after(function (done) {

        console.log('after'); done();;
    });
});