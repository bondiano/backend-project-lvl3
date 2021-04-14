// @ts-check
import path from 'path';
import _ from 'lodash';

/**
 * @param {String} url without protocol
 * @returns {String} filename with replaced all symblies expect string and digits to "-"
 *
 * urlToFilename('ru.hexlet.io/image.png')
 * // ru-hexlet-io-image.png
 *
 */
export const assetsUrlToFilename = (url) => {
  const { dir, name, ext } = path.parse(url);
  const filename = path.join(dir, name).replace(/\W/g, '-');

  return `${filename}${ext || '.html'}`;
};

export const htmlUrlToFilename = (link) => {
  const filename = _.trimEnd(link, '/').replace(/\W/g, '-');

  return filename;
};
