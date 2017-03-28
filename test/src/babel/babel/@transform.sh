#!/usr/bin/env bash


export NODE_PATH=${NODE_PATH}:~/.suman/global/node_modules
FILE=${SUMAN_CHILD_TEST_PATH};

FILENAME=$(basename ${FILE})
FILE_BASE=$(dirname $(dirname ${FILE}))/target

mkdir -p ${FILE_BASE}

babel ${FILE} --out-file ${FILE_BASE}/${FILENAME}
