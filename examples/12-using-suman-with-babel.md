First, to dissuade you from transpiling tests before you run them.

It's probably a bad idea to use Babel to transpile tests. Our view is that you should only use features that are currently
available via Node itself. 


1. Babel slows down development of tests, because running an individual test through Babel takes time. You thought starting up the JVM was slow?
2. If you need to transpile a test file, you obviously can't just run it with the node executable, which is inconvenient at best. You will have to transpile it first, then run it with node.
3. Async/await feature can be achieved directly via generators/yield, so we recommend just using plain-old generator functions until ES7 is finalized and part of Node itself.
4. Not all Babel features will make it into official versions ECMAScript.
5. Maintaining Suman to be compatible with future versions of node, is difficult and we simply cannot guarantee smooth sailing, in the same
way we can with current versions of Node.


Here is a description of how async/await can be achieved via generators:



Now, if you still really want to run your Suman tests through Babel, even if it's just for experimentation, you can do it.


Simpler, slower way:

1. run ```$ suman --use-babel``` in your project root, this will install the correct babel dependencies, as they are not included with the basic Suman installation.
2. either set transpile:true in your suman.conf.js file, or use the --transpile option at the command line, we will assume latter for now
3. ensure that the value for testDir in your suman.conf.js file, matches the top level directory that contains all of your test data, fixtures and test.js files.
4. run ```$ suman --transpile --all`

This will transpile/copy all the files in your test directory (specified by testDir, default is "test") and move them to the testDirCopyDir value, by default this is "test-target", a top-level directory
in your project.


More complicated, but more performant way:

1. run ```$ suman --use-babel``` in your project root, this will install the correct babel dependencies, as they are not included with the basic Suman installation.
2. either set transpile:true in your suman.conf.js file, or use the --transpile option at the command line, we will assume latter for now
3. ensure that the value for testDir in your suman.conf.js file, matches the top level directory that contains all of your test data, fixtures and test.js files.
4. Structure your test directory like so:

---test
 --/fixtures
 --/helpers
 --/src
   
 => fixtures contains all your test data (.json files etc), and static assets for testing.   
 => helpers contains JS files that are not actually to be run as tests
 => src contains all your .js test files, nested directories are allowed; anything that needs to be transpiled should go in here
 
 
4. run ```$ suman --transpile test/src/baz.test.js``` or ```$ suman -t test/src/baz.test.js```

What this will do is create a new directory at the same level as test/src, called test/target, and put the single transpiled baz.test.js file therein.


so your directory was like this before:

---test
 --/fixtures
 --/helpers
 --/src
  --one.test.js
  --two.test.js
  --baz.test.js
  
  
and now it looks like:


---test
 --/fixtures
 --/helpers
 --/src
  --one.test.js
  --two.test.js
  --baz.test.js
 --/target         <<<<<<<<< new dir, yay
  --baz.test.js    <<<<<<<<< we only transpiled one file, saving us a lot of time
  
  
 It's imperative that you structure your test directory properly, and the above structure is advised. 
 Otherwise, use the easier transpilation option when first trying out transpilation with Suman, using the --all option.