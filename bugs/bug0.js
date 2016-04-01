/**
 * Created by amills001c on 3/29/16.
 */


/**
 * Created by rpowar001c on 3/29/16.
 */

const Test = require('../lib').init(module, {
    export: false, //module.exports.wait = false;
    integrants: []
});


Test.describe('BBB', {parallel: true}, function (fs) {

    // console.log('fs:',fs);

    this.before(function () {

        // throw new Error('Yolo');
    });


    this.it('testing1', function () {

        throw new Error('erroA');

    }).it('testing2', function () {

        console.log('testing2');

    }).it('testing3', function () {
        console.log('testing3');
    });

});
