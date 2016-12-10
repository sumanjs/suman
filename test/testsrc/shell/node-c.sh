#!/bin/bash

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

echo "oh yes "$NODE_CHANNEL_FD"" >&2

if [ ! -z "$NODE_CHANNEL_FD" ]; then
printf "{\"type\":\"CONSOLE_LOG\",\"data\":\"weakkkkknesss\"}\n" 1>& ${NODE_CHANNEL_FD}
fi

MESSAGE=$(read -u "$NODE_CHANNEL_FD" msg)
echo " parent message => $msg"  >&2

#MESSAGE=$(read -u "$NODE_CHANNEL_FD")
#echo " parent message => $MESSAGE"  >&2
#
#MESSAGE=$(read -u "$NODE_CHANNEL_FD")
#echo " parent message => $MESSAGE"  >&2

node $(dirname $(dirname "$0"))/es5-es6/a.js

sleep 2
exit 1
