

const a = [1,2,3,4,5];


const b = a.reduce(function(prev,curr){
    console.log('prev:',prev,'curr:',curr);
     return prev + curr;
},0);

console.log('b:',b);