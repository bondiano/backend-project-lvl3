// @ts-check

import fs, { promises as fsp } from 'fs';
import path from 'path';
import util from 'util';
import stream from 'stream';

import _ from 'lodash';
import axios from 'axios';
import cheerio from 'cheerio';
import Listr from 'listr';
import debug from 'debug';

import { assetsUrlToFilename, htmlUrlToFilename } from './utils.js';

const pipeline = util.promisify(stream.pipeline);

const log = debug('page-loader');

/**
 * @typedef {Object} Asset
 * @property {URL} url
 * @property {String} filename
 */

/**
 * @typedef {Object} Content
 * @property {Array<Asset>} assets
 * @property {String} html
 */

/**
 * @param {String} html
 * @param {String} origin
 * @param {String} dir
 * @returns {Content} content
 *
 */
const prepareContent = (html, origin, dir) => {
  const $ = cheerio.load(html, { decodeEntities: false });

  const assets = [];

  const processByAttribute = (selector, attrName) => $(selector)
    .toArray().map((element) => $(element))
    .filter(($element) => Boolean(
      $element.attr(attrName) && new URL($element.attr(attrName), origin).origin === origin,
    ))
    .forEach(($element) => {
      const url = new URL($element.attr(attrName), origin);

      const filename = assetsUrlToFilename(`${url.hostname}${url.pathname}`);
      const filepath = path.join(dir, filename);

      assets.push({ url, filename });
      $element.attr(attrName, filepath);
    });

  processByAttribute('script,img', 'src');
  processByAttribute('link', 'href');

  return { html: $.html(), assets };
};

/**
 * @param {String} dir
 * @param {Asset} asset
 */
const downloadAssets = (dir, { url, filename }) => axios.get(url.toString(), { responseType: 'stream' })
  .then(({ data }) => {
    const fullPath = path.join(dir, filename);

    return pipeline(data, fs.createWriteStream(fullPath));
  });

export default (pageUrl, outputDir = '') => {
  log('page url', pageUrl);
  log('output', outputDir);

  const url = new URL(pageUrl);
  const link = `${url.hostname}${url.pathname}`;
  const filename = htmlUrlToFilename(link);
  const outputPath = path.resolve(process.cwd(), outputDir);
  const outputHTMLPath = path.join(outputPath, filename.concat('.html'));
  const assetsDirname = filename.concat('_files');
  const assetsOutputPath = path.join(outputPath, assetsDirname);

  return axios.get(pageUrl)
    .then(({ data }) => {
      const { html, assets } = prepareContent(data, url.origin, assetsDirname);

      log('write html file', outputHTMLPath);

      return fsp.writeFile(outputHTMLPath, html).then(() => ({ data, assets }));
    })
    .then(({ data, assets }) => {
      log('create directory for assets', assetsOutputPath);

      return fsp.access(assetsOutputPath).catch(
        () => fsp.mkdir(assetsOutputPath),
      ).then(() => ({ data, assets }));
    })
    .then(({ assets }) => {
      const tasks = assets.map((asset) => {
        log('Downloading asset', asset.url.toString(), asset.filename);
        return {
          title: asset.url.toString(),
          task: () => downloadAssets(assetsOutputPath, asset).catch(_.noop),
        };
      });

      const listr = new Listr(tasks, { concurrent: true });

      return listr.run();
    })
    .then(() => ({ filepath: outputPath }));
};
