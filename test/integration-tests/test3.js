/**
 * Created by amills001c on 12/3/15.
 */


var Test = require('../../lib').Test(module, 'suman.conf.js');


Test.describe('My Suite', function (suite) {


    this.describe('bugs', function () {


        this.it('is meow', function (t,done) {


            //throw new Error('jesus christ');
            //
            //
            //setTimeout(function(){
            //    throw new Error('jesus');
            //    done();
            //},10);

        });

        this.describe('turtles', {}, function () {

            this.beforeEach(function(){

                //throw new Error('michal');

            });

            this.loop(['cjage','ppage'],function(val){
                this.it('is chao' + val, function () {


                });
            });



            this.describe('sounds', function () {


                this.it('is good', function () {


                });


            });

        });

    });


});


/*Test.describe('My Suite 222', function (suite) {


    this.describe('bugs 222', function () {


        this.it('is meow 222', function () {


        });

        this.describe('turtles 222', function () {

            this.beforeEach(function(){


            });

            this.loop(['cjage 222','ppage 222'],function(val){
                this.it('is chao' + val, function () {

                    throw new Error('false');

                });
            });



            this.describe('sounds 2222', function () {


                this.it('is good 2222', function () {


                });


            });

        });

    });


});*/
