Promise.create = function (fn) {
  return new Promise(function (resolve, reject) {
    fn({
      resolve,
      reject
    })
  });
};

function foo() {
  return Promise.create(v => {
    v.resolve('dog');
  });
}

foo().then(v => console.log(v));


