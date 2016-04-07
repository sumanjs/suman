const suman = require('../../lib');

const Test = suman.init(module, {});


Test.describe('Zulu', {parallel: false}, function () {


    this.describe('A', {parallel: true}, function () {

        this.before(function(){
            console.log('before A');
        });

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

        this.after(function(){
            console.log('after 1');
        });

        this.describe('AA', {parallel: false}, function () {

            this.before(function(){
                console.log('before AA');
            });

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

            this.after(function(){
                console.log('after 2');
            });


        });

    });


    this.describe('B', {parallel: false}, function () {

        this.before(function(){
            console.log('before B');
        });

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

        this.before(function(){
            console.log('before C');
        });


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


        this.before(function(){
            console.log('before D');
        });


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
