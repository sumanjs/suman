const proto = {};

const p = Object.create(Function.prototype);

p.testing = function(){
   console.log('here is a method on p');
};


function P(){

}


Object.setPrototypeOf(P,p);


console.log(P instanceof Function);
console.log(typeof P);