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
        describe('3',function() {

            beforeEach(function () {

                console.log('before each 2');

            });

            it('4', function () {

                console.log('4');

            });

            it('5', function () {

                console.log('5');

            });

            it('6', function () {

                console.log('6');

            });
        });
    });



});