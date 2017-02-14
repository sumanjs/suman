#!/usr/bin/env bash

set -m # allow for job control
EXIT_CODE=0;  # exit code of overall script

function foo() {

     #echo $(jobs -l)
     for job in `jobs -p`; do
         echo "PID => ${job}"
         wait ${job} || { echo "At least one test failed with exit code => $?" ; EXIT_CODE=1 }
     done
}

trap 'foo' CHLD

DIRN=$(dirname "$0");

commands=(
    "{ echo "foo" && exit 4; }"
    "{ echo "bar" && exit 3; }"
    "{ echo "baz" && exit 5; }"
)

clen=`expr "${#commands[@]}" - 1` # get length of commands - 1

for i in `seq 0 "$clen"`; do
    (echo "${commands[$i]}" | bash) &   # run the command via bash in subshell
    echo "$i ith command has been issued as a background job"
done

# wait for all to finish
wait;

echo "EXIT_CODE => $EXIT_CODE"
exit "$EXIT_CODE"

# end
