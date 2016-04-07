const suman = require('../../lib');

const Test = suman.init(module, {});


Test.describe('gggg', {parallel: true}, function () {


    this.describe('A', {parallel: true}, function () {

        this.it(this.desc + '1', function (t, done) {
            setTimeout(function () {
                done();
            }, 800);
        });

        this.it(this.desc + '2', function (t, done) {
            setTimeout(function () {
                done();
            }, 800);
        });

    });


    this.describe('B', {parallel: true}, function () {

        this.it(this.desc + '1', function (t, done) {
            setTimeout(function () {
                done();
            }, 500);
        });

        this.it(this.desc + '2', function (t, done) {
            setTimeout(function () {
                done();
            }, 500);
        });

    });


    this.describe('C', {parallel: true}, function () {


        this.it(this.desc + '1', function (t, done) {
            setTimeout(function () {
                done();
            }, 300);
        });

        this.it(this.desc + '2', function (t, done) {
            setTimeout(function () {
                done();
            }, 300);
        });

    });


    this.describe('D', {parallel: true}, function () {


        this.it(this.desc + '1', function (t, done) {
            setTimeout(function () {
                done();
            }, 100);
        });

        this.it(this.desc + '2', function (t, done) {
            setTimeout(function () {
                done();
            }, 100);
        });

    });


});
