/**
 * Created by amills001c on 11/25/15.
 */


var suman = require('../index.js');
var suite = suman(module,'test/config/sumanConfig');


suite.define('#suite1', function (test) {


    test.before(function (done) {
        test.log('4');
        done();
    });

    test.before(function (done) {
        test.log('2');
        done();
    });

    test.it('logs stuff',function(){

        test.log('logging');
        throw new Error('bad');

    });

    test.after(function(done){

        test.log('after');
        done();
    });



});