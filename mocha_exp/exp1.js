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

            it('4', function (done) {

                console.log('4');

                setTimeout(function(){
                    done();
                },3000);


            });

            it('5', function (done) {

                console.log('5');

                setTimeout(function(){
                    done();
                },3000);

            });

            it('6', function (done) {

                console.log('6');

                setTimeout(function(){
                    done();
                },3000);

            });
        });
    });



});