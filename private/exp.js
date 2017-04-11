
let fn = function(a){
  return function(b){
    return a.apply(b);
  }
};

let apply = fn(function(){
  console.log(this.split(''));
});

apply('zebra');
