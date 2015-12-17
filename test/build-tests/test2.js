/**
 * Created by amills001c on 12/3/15.
 */



var suman = require('../../index.js');
var Test = suman(module, 'suman.conf.js');


Test.suite('suite 2', function (suite) {


    this.before(function(done){

         console.log('before');

        done();

    });


    var cars = [1,2,3];

    this.loop(cars,function(value){

       this.it('fantasy',function(){

           console.log(value);

       });

    });


    this.describe('desc', function(){


        this.describe('desc', function(){


            console.log('desc 1');

            this.before(function(done){

                console.log('before does');

                done();

            });


            this.it('does',function(){

                console.log('doeszzzzzz!!!!!!!!!!!!!!z 1');

            });

        });

        console.log('desc 1');

        this.before(function(done){

            console.log('before does');

            done();

        });


        this.it('does',function(){

           console.log('doeszzzzzz!!!!!!!!!!!!!!z 1');

        });

        this.describe('desc 4', function(){


            console.log('desc 4');

            this.before(function(done){

                console.log('before does 4444');

                done();

            });


            this.it('does',function(){

                console.log('doeszz444     444 z!!!!!!!!!!!!!!z 1');

            });

        });

    });




});