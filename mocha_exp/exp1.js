/**
 * Created by denman on 12/2/2015.
 */



describe('foo3222',function(){


    before(function(){

        console.log('before 0');
    });


    it('55555', function (done) {

        console.log('55555');

        setTimeout(function(){
            done(null);
        },1000);


    });

    describe('2',function(){

        before(function(){

            console.log('before 1');
        });

        describe('3',function() {

            before(function () {

                console.log('before 2');

            });

            it('  444444  ', function (done) {

                console.log('   4444 444  444  ');

                setTimeout(function(){
                    done(null);
                },1000);


            });

            after(function(){

                console.log('after x');
            });
        });


        describe('3',function() {

            before(function () {

                console.log('before 22');

            });


            after(function(){

                console.log('after x2');
            });
        });

        after(function(){

            console.log('after y');
        });
    });

    after(function(){

        console.log('after z');
    });



});