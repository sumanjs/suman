


```js

Test.describe('root suite description', {}, function(){   //root suite

    
    //we are in the context of the root suite
    
    const self = this;    // (avoid the self pattern in Suman tests, here for explanation only :)
   
    
    this.before(function(){
    
         console.log(this === self); //true
    
    });
    
    this.beforeEach(function(){
    
          console.log(this === self); //true
         
    });
    
    
    this.describe('child suite A', {}, function(){
  
          console.log(this.parent.title === 'root suite description'); // true
          
          const that = this;  // that !== self // true;   
           
  
        this.describe('child suite B', {}, function(){
           
             console.log(this.parent.title === 'child suite A');  // true
           
           
           
         });
  
  
  });

});
```

in test form that would look like!


```js

Test.describe('root suite description', {}, function(assert){   //root suite

    
    //we are in the context of the root suite
    
    const self = this;    // (avoid the self pattern in Suman tests, here for explanation only :)
   
    
    this.before(function(){
    
         assert(this === self); //true
    
    });
    
    this.beforeEach(function(){
    
          assert(this === self); //true
         
    });
    
    
    this.describe('child suite A', {}, function(){
  
          assert(this.parent.title === 'root suite description'); // true
          
          const that = this;  // that !== self // true;   
           
  
        this.describe('child suite B', {}, function(){
           
             assert(this.parent.title === 'child suite A');  // true
           
           
         });
  
  });

});
```