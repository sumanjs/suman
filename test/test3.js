/**
 * Created by amills001c on 11/25/15.
 */


var suman = require('../index.js');
var test = suman(module,'test/config/sumanConfig');


test.describe('#suite1', function (suite) {


    suite.before(function (done) {
        test.log('4');
        done();
    });

    suite.before(function (done) {
        test.log('2');
        done();
    });

    suite.it('logs stuff',function(){

        test.log('logging');
        throw new Error('bad');

    });

    suite.after(function(done){

        test.log('after');
        done();
    });



});