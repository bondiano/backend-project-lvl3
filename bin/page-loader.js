#!/usr/bin/env node

import program from 'commander';

import download from '../src/index.js';

program
  .description('Download page to your local machine with provided path')
  .version('1.0.0')
  .option('-o --output [dir]', 'Specify the path to the directory for the saved page', process.cwd())
  .arguments('<url>')
  .action((url) => {
    download(url, program.opts().output)
      .then(({ filepath }) => {
        console.log(`Page was downloaded into '${filepath}'`);
      })
      .catch((error) => {
        console.error(error.message);
        process.exit(1);
      });
  });

program.parse(process.argv);
