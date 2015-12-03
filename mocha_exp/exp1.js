/**
 * Created by denman on 12/2/2015.
 */



describe('blah',function(){


    before(function(){

        console.log('before');
    });

    beforeEach(function(){

        console.log('before each');

    });


    describe('2',function(){


       console.log('2');


        it('4',function(){

            console.log('4');

        });

    });



});