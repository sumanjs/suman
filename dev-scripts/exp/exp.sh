#!/usr/bin/env bash


#global_modules="${suman_global_npm_modules_path:-"$(npm root -g)"}"
#
#echo "global_modules => $global_modules"


#sh $(dirname $0)/exp.js



node -pe "JSON.parse('[\"one\",\"two\",\"three\"]')" | while read line; do
    echo "$line"
done
