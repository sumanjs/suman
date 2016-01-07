/**
 * Created by amills001c on 12/3/15.
 */


var Test = require('../../lib').Test(module, 'suman.conf.js');

Test.new('My Suite', function (suite) {


    this.describe('bugs', function () {


        this.it('is meow', function () {

        });

        this.describe('turtles', function () {

            this.beforeEach(function(){

                //console.log(this);
            });

            this.loop(['cjage','ppage'],function(val){
                this.it('is chao' + val, function () {

                    //throw new Error('false');

                });
            });



            this.describe('sounds', function () {


                this.it('is good', function () {


                });


            });

        });

    });


});

/*

Test.new('My Suite', function (suite) {


    this.describe('bugs', function () {


        this.it('is meow', function () {

            console.log('3');

        });

        this.describe('turtles', function () {

            this.beforeEach(function(){

                console.log('whoa');

            });

            this.loop(['cjage','ppage'],function(val){
                this.it('is chao' + val, function () {

                    throw new Error('false');

                });
            });



            this.describe('sounds', function () {


                this.it('is good', function () {

                    console.log('suman');

                });


            });

        });

    });


});*/
