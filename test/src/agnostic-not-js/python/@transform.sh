#!/usr/bin/env bash

FILE=${SUMAN_CHILD_TEST_PATH};

if [[ -z ${FILE} ]]; then

echo "copying all files over"
cp -r $(dirname "$0")/src/* $(dirname "$0")/target

else

cp -r $(dirname "$0")/src/* $(dirname "$0")/target

#echo "we have a filename => $FILE"
#
#FILENAME=$(basename ${FILE})
#FILE_BASE="$(cd $(dirname $(dirname ${FILE})) && pwd)/target"
#
#echo " => FILE_BASE => $FILE_BASE"
#
#mkdir -p ${FILE_BASE}
#
#cp ${FILE} ${FILE_BASE}
#
#echo "${FILE_BASE}/${FILENAME}"

fi

exit 0;


