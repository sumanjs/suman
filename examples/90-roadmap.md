The following features are currently in the works:


1. Hooking in bash scripts

    * Suman will look for a bash script which has the same name as your
    .js test in the same directory. It will launch the bash script instead
    of the .js file itself. Your bash script can setup the desired 
    environment and then is responsible for launching the .js file.
    The user will probably have to use a flag to indicate that they
    want to use bash scripts as hooks, and may need to put them in a 
    directory called sh.
    
2. Including more than one Test.describe per file.

    * this is probably completely unnecessary but may prove useful
    in some weird edge cases.
    

3. Support observables. 

    * As this area of Node and JS congeals, Suman will make
    observables a first-class citizen alongside promises and callbacks.
    
    
4. Suman runner can handle pre-defined groups of tests, using suman.groups.js

    * suman.groups.js will allow the user to define groups of tests that are to run
    together; this will basically override any behavior given by suman.order.js.