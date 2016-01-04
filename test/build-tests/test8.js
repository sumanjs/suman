/**
 * Created by denman on 1/1/2016.
 */



var Test = require('../../lib').Test(module, 'suman.conf.js');

Test.new('gggg', function () {

    this.beforeEach(function (done) {

        done();
    });

    this.after(function (done) {

        console.log('5');
       done();
    });

    this.after(function (done) {
        console.log('6');
        done();
    });

    this.describe(function () {

        this.after(function (done) {
            console.log('3');
           done();
        });

        this.beforeEach(function (done) {

            done();
        });



        this.describe('moodle', {
            isParallel: false
        }, function () {

            this.after(function (done) {
                console.log('1');
                done();
            });

            this.beforeEach(function (done) {

                done();
            });


            this.it('mmm1', {parallel: false}, function (done) {

               done();

            });

            this.beforeEach(function (done) {

                done();
            });

            this.afterEach(function (done) {

                done();
            });


            this.after(function (done) {
                console.log('2');
               done();
            });


        });

        this.after(function (done) {
            console.log('4');
            done();
        });


    });

    this.after(function (done) {
        console.log('7');
       done();
    });
});