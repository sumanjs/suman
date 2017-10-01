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


IFS=$'\n' # set this so that find command works for files with spaces in the path
RROOT=$(readlink -f "$DIR");
echo "DIR WITH package.json is => $DIR"
echo "readlink is => $RROOT"
DIRR=$(dirname "$DIR");
echo "DIRR is => $DIRR"

find "$DIR" -maxdepth 8 -type f  -path "*.js" -not -path "*/node_modules/*" \
-not -path "*/node_modules/*" -not -path "*/babel/*" -not -path "*/examples/*" | while read line; do
# try to compile all .js files
 node -c ${line} && echo " processed file $line" || { echo "file could not be compiled => $line" && exit 1; }
done



EXIT_CODE="$?"
echo " exit code => $EXIT_CODE"
exit "$EXIT_CODE"

