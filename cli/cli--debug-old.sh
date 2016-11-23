#!/usr/bin/env bash

# #!/usr/bin/env node --debug-brk=5858 --debug=5858 --harmony
# #!/usr/bin/env node --debug=5858 --harmony

exec node --debug-brk=5858 --debug=5858 <<EOF

process.env.SUMAN_EXTRANEOUS_EXECUTABLE = 'yes';
//require index explicitly, do *not* do require('.') because that will look-up package.json.main
require('./cli.js');

EOF