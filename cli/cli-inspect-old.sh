#!/usr/bin/env bash

# #!/usr/bin/env node --inspect --debug-brk --harmony

exec node --inspect --debug-brk <<EOF

console.log('dirname => ',__dirname);
process.env.SUMAN_EXTRANEOUS_EXECUTABLE = 'yes';
require('./cli.js');

EOF