/**
 * Created by amills001c on 12/1/15.
 */


var suman = require('../index.js');
var Test = suman(module, 'test/config/sumanConfig');


Test.suite('suite dos', function (suite) {


    this.it('my test',function(){

        console.log('doing test');

    });

    this.afterEach(function(done){


        console.log('1' + this.currentTest);

        done();
    });


    this.afterEach(function(done){


        console.log('2' + this.currentTest);

        done();
    });


    this.afterEach(function(done){


        console.log('3' + this.currentTest);

        done();

    });


});