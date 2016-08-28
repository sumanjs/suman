


```

usage: suman [file/dir] [OPTIONS]

options:
    --version                           Print tool version and exit.
    -h, --help                          Print this help and exit.
    -v, --verbose                       Verbose output. Use multiple times for
                                        more verbose.
    --vv, --vverbose                    Very verbose output. There is either
                                        verbose or very verbose (vverbose).
    --sparse                            Sparse output. Less verbose than
                                        standard.
    --vsparse                           Very sparse output. Even less verbose
                                        than sparse option.
    --init                              Initialize Suman in your project;
                                        install it globally first.
    --no-tables                         No ascii tables will be outputted to
                                        terminal. Accomplished also by
                                        "--vsparse" boolean option.
    --coverage                          Run Suman tests and see coverage report.
    -r, --recursive                     Use this option to recurse through
                                        sub-directories of tests.
    --safe                              Reads files in with fs.createReadStream
                                        and makes sure it's a suman test before
                                        running.
    -f, --force                         Force the command at hand.
    --ff, --fforce                      Force the command at hand, with super
                                        double force.
    -p, --pipe                          Pipe data to Suman using stdout to
                                        stdin.
    --cnvt, --convert                   Convert Mocha test file or directory to
                                        Suman test(s).
    -b, --bail                          Bail upon the first test error.
    --ignore-brk                        Use this option to aid in the debugging
                                        of child_processes.
    --rnr, --runner                     Use runner even when executing only one
                                        test file.
    --reporters=ARG                     Specify name of reporters to be used
                                        deemed by your config file.
    --reporter-paths=ARG                Specify reporters by specifying path(s)
                                        to reporter module(s).
    --diagnostics                       Run diagnostics to see if something may
                                        be wrong with your suman.conf.js file
                                        and/or project structure.
    --fst, --full-stack-traces          Full stack traces will be shown for all
                                        exceptions, including test failures.
    --procs=INT, --processes=INT        Override config value for maximum number
                                        of parallel Node.js processes.
    -s, --server                        Convert Mocha test file or directory to
                                        Suman test(s).
    --cfg=ARG, --config=ARG             Path to the suman.conf.js file you wish
                                        to use.
    --gfbn=ARG, --grep-file-base-name=ARG
                                        Regex string used to match file names;
                                        only the basename of the file path.
    --gf=ARG, --grep-file=ARG           Regex string used to match file names.
    --gs=ARG, --grep-suite=ARG          Path to the suman.conf.js file you wish
                                        to use.
    --sn=ARG, --server-name=ARG         Path to the suman.conf.js file you wish
                                        to use.
    --tlrnr, --tail-runner              Option to tail the suman-err.log file
                                        defined by the path in your suman
                                        config.
    --tltst, --tail-test                Option to tail the suman-err.log file
                                        defined by the path in your suman
                                        config.

```