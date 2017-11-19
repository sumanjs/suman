#!/usr/bin/env bash

if [[ ! -d "node_modules" ]]; then
 echo "not in the right directory?"
 exit 1;
fi

files=$(find "node_modules/suman-types/dts" -name "*.d.ts")

for file in "$files"; do
    echo "touching file $file";
    touch "$file";
done

touch "node_modules/suman-types"
