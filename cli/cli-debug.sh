#!/usr/bin/env bash

# #!/usr/bin/env node debug --harmony
exec node debug <<EOF

process.env.SUMAN_EXTRANEOUS_EXECUTABLE = 'yes';
//require index explicitly, do *not* do require('.') because that will look-up package.json.main
require('./index');

EOF