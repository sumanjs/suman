/**
 * Created by Olegzandr on 5/14/16.
 */

var a ={a:'1'};
var d = Object.assign({},a);



console.log(d);

d.p = 5;


console.log(d);
console.log(a);