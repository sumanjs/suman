The runs directory is a default Suman structure that contains the stdout/stderr
for each separate test process. We keep the most recent 5 runs for your reference.

The directory names inside the run directory are of the pattern ```<timestamp-runid>```

Where timestamp is just a ```Date.now()``` value and runid is a unique integer that is simply incremented every
time you issue the suman command. Therefore, if you see that runid is 5545, that means you have issued
the suman command 5545 times on your local machine :)
