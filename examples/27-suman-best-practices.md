## Transpilation

If you are running an individual test file, and you in the process of developing or debuggng the test, you can and should use
babel-node, which is available with the suman-babel command.

If you are running a group of tests and want to transpile first, then you should turn this into a 
gulp task or makefile task.


## Organization

We highly recommend having all your tests stick to a naming convention

for example, a suman test should always end with ```".test.js"```.

that way, when use Make or Gulp etc, you can use

```TESTS=$(shell find test/ -name "*.test.js")```

in this way, you can distinguish which files to run, and the Suman
runner will never run a non-Suman test file.




