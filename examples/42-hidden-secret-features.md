

Suman has some hidden/secret features


Did you know that t is a function?

``` this.it('whoa', t => {

     assert(typeof t === 'function');

});
```

the reason for this is to support direct/automatic conversion from Mocha, so that you can still do things like:


``` 

function helper(data, cb){
    
      if(!data){
        cb(new Error('data is not defined');
      }
      else{
      ... do something with data
      }

});



this.it('whoa', helper.bind(null, 'some data'));


```

as you can see ```helper.bind(null, 'some data')``` returns a new function that simple takes one argument => an error-first callback.
and it turns out that t is simply an error-first callback!