#!/usr/bin/env bash


#global_modules="${suman_global_npm_modules_path:-"$(npm root -g)"}"
#
#echo "global_modules => $global_modules"


#sh $(dirname $0)/exp.js

json_array=\''["one","two","three"]'\';

function getJSON {
   node -pe "JSON.parse($json_array).join('\n')"
}

getJSON | while read line; do
    echo "$line"
done
