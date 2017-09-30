#!/usr/bin/env bash

echo "we are running @transform.sh"
cd $(dirname "$0");
chmod -R 777 $(pwd)/@target


if [[ ! -z ${SUMAN_CHILD_TEST_PATH} ]]; then

    SUMAN_TARGET="${SUMAN_CHILD_TEST_PATH//@src/@target}"
    SUMAN_RUNNABLE=${SUMAN_TARGET%.*}.js

    echo "SUMAN_CHILD_TEST_PATH => $SUMAN_CHILD_TEST_PATH"
    echo "SUMAN_RUNNABLE => $SUMAN_RUNNABLE"

    if [[ ${SUMAN_RUNNABLE} -nt ${SUMAN_CHILD_TEST_PATH} ]]; then
        echo "no need to transpile since the transpiled file is correct."
    else
        echo "we must transpile file."
        tsc $(pwd)/@src/*.ts --outDir $(pwd)/@target
        chmod -R 777 $(pwd)/@target
    fi

else

    for x in $(suman-t --extract-json-array=${SUMAN_ALL_APPLICABLE_TEST_PATHS}); do
        tsc x;  # transpile file with filepath ="x"
    done

fi



