/**
 * Created by amills001c on 12/1/15.
 */


var Test = require('../../lib').Test(module, 'suman.conf.js');


Test.describe('suite dos', function (suite) {

    var dog = this;

    this.it('my test',function(t){

        var mike = dog;
        t.data.rooogo = 'pooo';

    });

    this.afterEach(function(t, done){


        done();
    });


    this.afterEach(function(t,done){


        done();
    });


    this.afterEach(function(t, done){


        done();

    });


});