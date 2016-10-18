If an error is thrown from a test or hook and is not captured correctly, use t.wrap() on the innermost function/callback.


```
this.it('throws error', t => {
    
    asyncFn().then(function(){
    
        throw new Error('uncaught error');
    
    });


});
```


if the above error fails to get pinned to the right test case, you can do this:


```
this.it('throws error', t => {
    
    asyncFn().then(t.wrap(function(){
    
        throw new Error('now this error gets trapped correctly');
    
    }));


});
```

and then we guarantee the error will get trapped correctly!