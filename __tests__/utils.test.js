import { assetsUrlToFilename, htmlUrlToFilename } from '../src/utils';

const assetsCases = [
  ['ru.hexlet.io/image.png', 'ru-hexlet-io-image.png'],
  ['ru.hexlet.io/packs/js/runtime.js', 'ru-hexlet-io-packs-js-runtime.js'],
];

const pageCases = [
  ['vk.com', 'vk-com'],
  ['vk.com/', 'vk-com'],
  ['www.vk.com', 'www-vk-com'],
  ['ru.hexlet.io/', 'ru-hexlet-io'],
];

describe('assetsUrlToFilename', () => {
  test.each(assetsCases)('%s', (url, expected) => {
    expect(assetsUrlToFilename(url)).toBe(expected);
  });
});

describe('htmlUrlToFilename', () => {
  test.each(pageCases)('%s', (url, expected) => {
    expect(htmlUrlToFilename(url)).toBe(expected);
  });
});
