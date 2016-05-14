/**
 * Created by denman on 2/7/2016.
 */



var suman = require('../../lib');
var Test = suman.init(module, {

});

Test.describe('A2', {}, function (delay) {

    var arr = [1, 2];

    setTimeout(function () {
        arr.push(4);
        delay();
    }, 100);

    arr.forEach((item)=> {

        this.it('[test]' + item, function (t) {
            console.log('A => ' + t.desc);
        });

    });

    this.before.cb(t => {
        setTimeout(function () {
            t.done();
        }, 100);
    });

    this.describe('B', function (delay) {

        setTimeout(function () {
            arr.push(8);
            delay();
        }, 100);

        arr.forEach((item)=> {

            this.it('[test]' + item, t => {
                console.log('B1 => ' + t.desc);
            });

        });

        this.describe(function () {
            arr.forEach((item)=> {

                this.it('[test]' + item, t => {
                    console.log('B2 => ' + t.desc);
                });

            });
        });
    });

    this.describe('C', function (delay) {

        setTimeout(function () {
            arr.push(9);
            delay();
        }, 100);

        this.describe('j', function (delay) {

            setTimeout(function () {
                arr.push(13);
                delay();
            }, 100);

            arr.forEach((item)=> {

                this.it('[test]' + item, t => {
                    console.log('C => ' + t.desc);
                });

            });


            this.describe('D', function () {

                arr.forEach((item)=> {

                    this.it('[test]' + item, t => {
                        console.log('D => ' + t.desc);
                    });

                });

            });
        });

    });

});