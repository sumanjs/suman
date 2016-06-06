

# Debugging Suman tests and via the Suman runner


## Debugging using logs (stdout/stderr)

If you see an exception/error with a test that was executed via the Suman runner, that does not occur when running the test in a single-process, your best bet is to use
logging facilities to debug, unless you are currently expert in debugging child_processes. Note that if the same problem occurs for a particular test with the runner and running the test directly, debug it first directly using node
or suman without the --runner flag.

debugging tips - "use strict", verbose flags, log files, SUMAN_DEBUG

When using the Suman runner, stdout and stderr for every test file will be logged to 
suman/runner-stdout.log and suman/runner-stderr.log respectively.

When developing Suman tests, we recommend tailing these log files:




## Debugging via debugging tools


1. With node debug

node debug is the "native" node way of debugging node applications

```$ node debug a.test.js```



2. With Node inspector


first make sure you have node-inspector installed for command line use (installed globally):

```$ npm install -g node-inspector```

 
 if we want to debug a test directly
 
```$ node-debug a.test.js```
 
 
 or using the suman executable and the command line options that come with it:
   

```$ node-debug suman a.test.js --timeout=500000```  //everything in single-process

```$ node-debug suman a.test.js --timeout=500000 --runner```  /// we want a challenge, will debug via the runner


3. With Webstorm

Webstorm has a fantastic IDE debugging tool called "xxx"