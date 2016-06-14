/**
 * Created by amills on 6/3/16.
 */


var f = function(){

};


var obj = {
   a: function(){
       console.log('a');
   }
};

// f.__proto__ = obj;

console.log(f.__proto__);

f.a();