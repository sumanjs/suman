#!/usr/bin/env bash


arr=()  # holds PIDs

commands=(
    "echo $PWD && suman test/testsrc/es5-es6"
    "echo $PWD && suman test/testsrc/es5-es6"
)

clen=`expr "${#commands[@]}" - 1` # get length of commands - 1

for i in `seq 0 "$clen"`
do
    (echo "${commands[$i]}" | bash) & arr+=($!)  # run the command via bash in subshell and push PID to array
done

len=`expr "${#arr[@]}" - 1`  # get length of arr - 1

EXIT_CODE=0;  # exit code of overall script

for i in `seq 0 "$len"`
do
    pid="${arr[$i]}";
    echo "PID => $pid"
    wait ${pid} ; CODE="$?"
    if [[ ${CODE} > 0 ]]; then
       echo "at least one test failed";
      EXIT_CODE=1;
      fi
done

echo "EXIT_CODE => $EXIT_CODE"
exit "$EXIT_CODE"
