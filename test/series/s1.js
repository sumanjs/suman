/**
 * Created by denmanm1 on 4/13/16.
 */



this.series([
    this.it('makes stuff 3', function () {

        console.log(this.temp);

    }),
    this.it('makes stuff 4', function (done) {


        done();

    })
]);


this.loop(['5', '6', '7'], function (value) {

    this.it('makes stuff ' + value, function (done) {

        console.log(this.temp);
        done();

    });

});


this.parallel(function () {


    this.it('makes stuff 8', function (done) {

        console.log(this.temp);
        done();

    }).it('makes stuff 9', function () {

        console.log(this.temp);

    }).it('makes stuff 10', function (done) {

        done();

    });


});