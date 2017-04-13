#!/usr/bin/env node

/* eslint-disable no-console */

const Promise = require('bluebird');
const glob = require('glob');
const path = require('path');
const request = require('request-promise');
const hashFiles = require('hash-files');
const assert = require('assert');
const flatten = require('lodash/flatten');
const mime = require('mime-types');

// base64 1x1 px transparent png
const req = request.defaults({
  headers: {
    accept: 'application/vnd.api+json',
    'content-type': 'application/vnd.api+json',
    'accept-version': '~1',
  },
  gzip: true,
  json: true,
});

// gets JWT token for CURL requests generator
const authenticate = ({ username, password, endpoint }) => (
  req
    .post({
      baseUrl: endpoint,
      uri: '/users/login',
      body: { data: { id: username, type: 'user', attributes: { password } } },
    })
    .promise()
    .get('meta')
    .get('jwt')
);

const getUploadTagsList = (argv) => {
  const root = path.resolve(process.cwd(), argv.dir);
  const sections = glob.sync('*', { cwd: root });

  // gives complete list of section/genres
  // we need to retrieve cover & icon if it's available
  return flatten(sections.map((section) => {
    const base = path.resolve(root, section);
    return glob.sync('*', { cwd: base }).map((genre) => {
      const folder = path.resolve(base, genre);
      const assetsPaths = {};
      const assetsLinks = {};

      // at this point we check that png exist
      const files = glob.sync('*.{png,jpg}', { cwd: folder });
      const id = genre.replace(/[^a-zA-Z0-9]/g, '-');

      files.forEach((asset) => {
        const ext = path.extname(asset);
        const assetName = path.basename(asset, ext);
        const assetPath = path.resolve(folder, asset);
        const hash = hashFiles.sync({ files: [assetPath], algorithm: 'sha256' });
        assetsPaths[assetName] = path.resolve(folder, asset);
        assetsLinks[assetName] = `https://${argv.cdn}/${argv.prefix}/${id}/${assetName}.${hash.slice(0, 8)}${ext}`;
      });

      // verify that cover exists
      assert.ok(assetsPaths.cover, `cover must be present for ${folder}`);

      // icon can be defaults to placeholder
      if (!assetsLinks.icon) {
        assetsLinks.icon = argv.placeholder;
      }

      return {
        assetsPaths,
        tag: {
          section,
          cover: assetsLinks.cover,
          icon: assetsLinks.icon,
          id,
          eng: genre
            .replace(/-/g, ' ')
            .replace(/_/g, '/')
            .replace(/\^/g, '&')
            .replace(/\w+/g, (match) => {
              return match[0].toUpperCase() + match.slice(1);
            }),
        },
      };
    });
  }));
};

// uploads images to CDN & prints curl requests to perform adding the data
// to the calendar
function prepareCURL(argv) {
  const genres = getUploadTagsList(argv);

  return authenticate(argv).then((token) => {
    // now generate CURL requests
    const curlRequests = genres.map(({ tag }) => (
      `curl -X POST -H 'Content-Type: application/vnd.api+json' \\
        '${argv.endpoint}/calendar/event/tags/${argv.action}' \\
        -d '${JSON.stringify({ token, tag: argv.action === 'delete' ? tag.id : tag })}'`
    ));

    console.log(`\n\nCURL ${argv.action} requests:\n----\n`);
    console.log(curlRequests.join('\n\n'));
    console.log('\n----\n\n');

    return curlRequests;
  });
}

// uploads files in the directory
function uploadFiles(argv) {
  // example:
  //  -x ~/projects/rfx-chef/cookbooks/rfx-docker/files/default/gce-key.json
  // eslint-disable-next-line import/no-dynamic-require
  const credentials = require(argv.credentials);

  const gcs = require('@google-cloud/storage')({
    projectId: credentials.projectId,
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
  });

  const genres = getUploadTagsList(argv);
  const bucket = Promise.promisifyAll(gcs.bucket(argv.cdn));

  return Promise.map(genres, ({ assetsPaths, tag }) => {
    const promises = [];

    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const asset in assetsPaths) {
      const assetPath = assetsPaths[asset];
      const file = path.basename(tag[asset]);

      const opts = {
        destination: `${argv.prefix}/${tag.id}/${file}`,
        resumable: false,
        public: true,
        metadata: {
          contentType: mime.lookup(assetPath) || 'application/octet-stream',
          cacheControl: 'public, max-age=31536000',
        },
      };

      promises.push(
        bucket.uploadAsync(assetPath, opts).tap(() => {
          console.info('uploaded %s to https://%s/%s', assetPath, argv.cdn, opts.destination);
        })
      );
    }

    return Promise.all(promises);
  });
}

// run program
// eslint-disable-next-line no-unused-expressions
require('yargs')
  .command({
    command: 'curl',
    desc: 'prepare curl requests based on dir structure',
    handler: prepareCURL,
  })
  .command({
    command: 'upload',
    desc: 'upload assets based on dir structure',
    handler: uploadFiles,
  })
  .option('action', {
    alias: 'a',
    describe: 'action to perform',
    choices: ['create', 'update', 'delete'],
    default: 'create',
  })
  .option('username', {
    alias: 'u',
    demandOption: true,
    describe: 'login for the users service',
  })
  .option('password', {
    alias: 'P',
    demandOption: true,
    describe: 'password for login',
  })
  .option('endpoint', {
    alias: 'h',
    demandOption: true,
    describe: 'host where API is located',
  })
  .option('credentials', {
    alias: 'x',
    demandOption: true,
    describe: 'credentials for cdn',
  })
  .option('dir', {
    alias: 'd',
    demandOption: true,
    describe: 'directory structured for tags',
  })
  .option('cdn', {
    alias: 'c',
    demandOption: true,
    describe: 'cdn to upload data to',
  })
  .option('prefix', {
    describe: 'cdn prefix',
    default: 'calendar',
  })
  .option('placeholder', {
    alias: 'p',
    demandOption: true,
    describe: 'placeholder for missing icons',
  })
  .demandCommand(1, 'You need at least one command before moving on')
  .help()
  .argv;
