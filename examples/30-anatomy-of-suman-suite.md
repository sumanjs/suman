


```js

Test.describe('root suite description', {}, function(){   //root suite


    //we are in the context of the root suite
    
    const self = this;  // avoid the self pattern in Suman tests, here for explanation only :)
    
    this.before(function(){
    
         // this === self; //true
    
    });
    
    this.beforeEach(function(){
    
          // this === self; //true
         
    });
    
    
    this.describe('child suite A', {}, function(){
  
          // this.parent.title === 'root suite description'; // true
          
          //const self = this;  //can't do this because self is already defined
          
          const that = this;  // that !== self // true;   
           
  
        this.describe('child suite B', {}, function(){
           
             // this.parent.title === 'child suite A'; // true
           
           
           
         });
  
  
  });

});
```