/**
 * Created by denman on 1/3/2016.
 */


describe('1',function(){



    describe('2',function(){

        describe('3',function(){


           [1,2,3,4].forEach(function(val){

               it('fff',function(){

                   console.log('it val:',val);

               });

           });



        });

        afterEach(function(){
            console.log('1')
        });

    });

    afterEach(function(){
        console.log('2')
    });

});