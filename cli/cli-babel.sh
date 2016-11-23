#!/usr/bin/env bash

# #!/usr/bin/env babel-node --presets stage-3
exec babel-node --presets stage-3 <<EOF

process.env.SUMAN_EXTRANEOUS_EXECUTABLE = 'yes';
//require index explicitly, do *not* do require('.') because that will look-up package.json.main
require('./cli.js'); //require index


EOF