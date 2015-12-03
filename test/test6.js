/**
 * Created by denman on 12/2/2015.
 */


var suman = require('../index.js');
var Test = suman(module, 'test/config/sumanConfig');


Test.suite('suite dos', function (suite) {

    var shuggles = null;


    this.before(function(done){

        console.log('before');

        shuggles = 5;
        console.log('this:',this);

        return done();

    });


    this.it('my test',function(){

        console.log('doing test');

    });

    this.afterEach(function(done){

        console.log('1' + this.currentTest);
        done();

    });


   this.describe('tarzan',function(){

       console.log('shuggles describe:',shuggles);


       this.before(function(done){

           console.log('shuggles before:',shuggles);
           console.log('before terzan 2');
           done();

       });

       this.it('my tarzan test',function(){

           console.log('doing tarzan test');

       });

       this.describe('uuuuu test',function(){


           this.before(function(done){

               console.log('before boozzzz ');
               done();

           });

           this.it('my boooz test',function(){

               console.log('doing booooz test');

           });

       });

   });


});