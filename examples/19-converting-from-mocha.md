You can easily convert a single Mocha test or directory of Mocha tests to Suman tests with the following command:

<br>
<span style="background-color:#9ACD32">&nbsp;```$ suman --convert --src=[src-dir/src-file] --dest=[dest-dir]```</span>
<br>
<br>

### Making the switch, taking the plunge

The best steps to start making the switch from Mocha to Suman are as follows: 

1. Create a commit or tag before you do anything further; the commit message might be "last commit pre-suman-conversion"

2. Rename your "test" directory to "test-old" or whatever your test directory is called if it's not "test"

3. <span style="background-color:#9ACD32">&nbsp;```$ suman --convert test-old test```</span>

This should run very quickly, much less than 1 second. Now you have Suman tests replacing 
all your Mocha tests in your original test directory!

You can compare the new Suman tests with the old Mocha tests in test-old for awhile, for reference. Please be aware of the common catches and caveats associated with
converting Mocha tests to Suman tests, below. We are working on making the conversion 100% reliable, so that running newly minted Suman tests via prior Mocha tests works without any tweaking, but as of now
there are a couple problems (which may be fixed with some Babel plugins).


##  Here are the pitfalls and caveats with regard to converting from Mocha to Suman:


Suman test cases and hooks use a singular param t (callback functions belong to that object, and they can be called in any context, without problem).


1. Problem caused by: hooks that forgo the anonymous wrapper function

normally we have:

```js
before(function(done){    //mocha version
  someHelperFn(done);
});

this.before.cb(t => {     //suman equivalent
  someHelperFn(t.done);
});
```
  
  
  *however*
  
  if you busted this move in your Mocha test suites:
  
```js
before(someHelperFn);  // nice work, but...
```
  
  As you may infer, Suman won't be able to convert correctly in this case. 
  You will have to do some minor refactoring of your someHelperFn, so that it references
  the Suman done callback correctly.
  
  All you will really need to do is put this line as the first line of someHelperFn, wherever it is:
  
```js
const done = t.done;
```
  
  
  the best way to do this, however, is:
 
````  
this.before.cb(t => {   
   someHelperFn(t.done);
});
```

this is because it's possible that someHelperFn is not test specific code and may accept calls from actual application code, which doesn't and shouldn't have 
any knowledge of the Suman API or the singular t param signature.


for example:

```js
function someHelperFn(cb){
 //do some work, yadda yadda
 process.nextTick(cb);  // we fire the callback in the next tick of the event loop
}
```
 
 if you changed the above to:
 
```js
function someHelperFn(t){
  const done = t.done;
  process.nextTick(done);  // we fire the callback in the next tick of the event loop
}
```

or equivalently

```js
function someHelperFn(t){
  process.nextTick(t.done);  // we fire the callback in the next tick of the event loop
}
```
  
  with the above fix, you might break some of your current APIs, so just be aware of that
 
 
 