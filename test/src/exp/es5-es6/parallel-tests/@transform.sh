#!/usr/bin/env bash


NODE_PATH=${NODE_PATH}:~/.suman/global/node_modules
FILE=${SUMAN_CHILD_TEST_PATH};

FILENAME=$(basename ${FILE})
FILE_BASE="$(cd $(dirname $(dirname ${FILE})) && pwd)/target"

mkdir -p ${FILE_BASE}

cp ${FILE} ${FILE_BASE}

echo "${FILE_BASE}/${FILENAME}"
exit 0;
