/**
 * Created by denman on 2/7/2016.
 */



var suman = require('../../lib');
var Test = suman.Test(module, 'suman.conf.js');

Test.describe('A', {}, ['request', 'socket.io'], function (request, socketio) {

    //console.log('request:', request.toString());
    //console.log('socketio:', socketio.toString());

    var arr = [1, 2, 3];

    setTimeout(function () {
        arr.push(4);
        arr.push(5);
        arr.push(6);
        //delay();
    }, 100);

    this.before(function (done) {

        setTimeout(function () {
            done();
        }, 1000);

    });

    this.describe('B', function (delay) {

        setTimeout(function () {
            arr.push(8);
            delay();
        }, 100);

        this.describe(function () {
            arr.forEach((item)=> {

                this.it('[test]' + item, function (t) {
                    console.log('B => ' + t.desc);
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

                this.it('[test]' + item, function (t) {
                    console.log('C => ' + t.desc);
                });

            });


            this.describe('D', function () {

                arr.forEach((item)=> {

                    this.it('[test]' + item, function (t) {
                        console.log('D => ' + t.desc);
                    });

                });

            });
        });

    });

});


