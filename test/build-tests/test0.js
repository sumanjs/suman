/**
 * Created by denman on 1/1/2016.
 */



var Test = require('../../lib').Test(module, 'suman.conf.js');

Test.new('gggg', function () {

    this.before(function () {

        console.log('before');
    });


    this.describe('bum', function () {

        console.log('describe');

        this.it('mmm', {
            parallel: true
        }, function () {


        });

    });


});