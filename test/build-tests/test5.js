/**
 * Created by amills001c on 12/1/15.
 */


var Test = require('../../lib').Test(module, 'suman.conf.js');


Test.new('suite dos', function (suite) {

    var dog = this;

    this.it('my test',function(){

        var mike = dog;
        this.data.rooogo = 'pooo';

    });

    this.afterEach(function(done){


        done();
    });


    this.afterEach(function(done){


        done();
    });


    this.afterEach(function(done){


        done();

    });


});