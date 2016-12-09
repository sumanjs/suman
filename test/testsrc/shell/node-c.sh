#!/usr/bin/env bash

DIR=$(dirname "$0");

echo "DIR => $DIR"

RESULT="";
VAL=""

while [ "$DIR" != "/" ] ;
do DIR=$(dirname $(dirname "$DIR"));
RESULT=$(find "$DIR" -maxdepth 1 -name package.json);

if [ ! -z "$RESULT" ]; then break; fi;
 done


FILES=$(find $(dirname "$DIR")/**/**/*.js -type f -maxdepth 8 -not -path "*/babel/*" -not -path "*/examples/*");
echo "FILES => $FILES"

node -c ${FILES}

EXIT_CODE="$?"
echo " exit code => $EXIT_CODE"
#exit "$EXIT_CODE"

exit 1
