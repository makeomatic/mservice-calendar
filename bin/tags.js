#!/usr/bin/env node

// upload tags section
function uploadTags(argv) {

}

// run program
// eslint-disable-next-line no-unused-expressions
require('yargs')
  .command({
    command: 'upload <dir>',
    desc: 'uploads tags based on the directory structure',
    handler: uploadTags,
    builder: {
      dir: {

      },
    },
  })
  .demandCommand(1, 'You need at least one command before moving on')
  .help()
  .argv;
