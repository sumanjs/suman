/**
 * Created by amills001c on 12/3/15.
 */



var suman = require('../../index.js');
var Test = suman.new(module, 'suman.conf.js');


Test.suite('suite 2', function (suite) {


    this.before(function(done){


        done();

    });


    var cars = [1,2,3];

    this.loop(cars,function(value){

       this.it('fantasy',function(){


       });

    });


    this.describe('desc', function(){


        this.describe('desc', function(){




            this.before(function(done){



                done();

            });


            this.it('does',function(){



            });

        });

        console.log('desc 1');

        this.before(function(done){



            done();

        });


        this.it('does',function(){



        });

        this.describe('desc 4', function(){




            this.before(function(done){



                done();

            });


            this.it('does',function(){


            });

        });

    });




});