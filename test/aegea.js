/**
 * Created by amills001c on 2/9/16.
 */




describe('A', function () {


    var arr = null;


    //doSomethingSync();

    before('b', function (done) {

        console.log(3);
        setTimeout(function () {
            arr = [1, 2, 3];
            console.log(4);
            done();
        }, 100);


    });

    console.log(2);

    it('tests', function (done) {

        console.log(1);
        ///do some async testing
        done();
    });


});