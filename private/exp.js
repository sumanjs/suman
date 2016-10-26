

var str = /\.test\.js$/.toString();

str = str.slice(1,-1);

console.log(str);

console.log(new RegExp(str));

