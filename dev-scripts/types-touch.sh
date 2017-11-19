#!/usr/bin/env bash

if [[ ! -d "node_modules" ]]; then
 echo "not in the right directory?"
 exit 1;
fi

files="$(find "node_modules/suman-types/dts" -name "*.d.ts")"

for f in ${files}; do
    echo "touching file $f";
    touch "$f";
done

touch "node_modules/suman-types"
