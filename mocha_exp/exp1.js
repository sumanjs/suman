/**
 * Created by denman on 12/2/2015.
 */



describe('foo',function(){


    before(function(){

        console.log('before');
    });

    beforeEach(function(){

        console.log('before each 1');

    });


    describe('2',function(){


        beforeEach(function(){

            console.log('before each 2');

        });


        it('4',function(){

            console.log('4');

        });

    });



});