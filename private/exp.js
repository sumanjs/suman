
var fn = function(a){
  return function(b){
    return a.apply(b);
  }
};

var apply = fn(function(){
  console.log(this.split(''));
});

apply('zebra');
