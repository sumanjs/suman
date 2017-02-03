/**
 * Created by oleg on 1/8/17.
 */



console.log('z');


Promise.resolve('z').then(function(){
    console.log('b');
});

console.log('a');
