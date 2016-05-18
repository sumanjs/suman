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
    in some weird use cases.
    

3. Create facilities to collect coverage reporting for multiple files in
one run.
    * most likely this will come in the form of Suman generating
    a bash script that will run all the tests that the user requests