/**
 * Created by denman on 2/7/2016.
 */




describe('foor',function(){

    var arr = [0];

    before(function(done){

        setTimeout(function(){
            arr.push(1);
            arr.push(2);
            arr.push(3);
            done();
        },1000);

    });

    describe('bar',function(){

        arr.forEach(function(item){

            it('[test]' + item, function(){

            });

        });

    });

});