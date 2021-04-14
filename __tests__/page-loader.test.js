import os from 'os';
import path from 'path';
import { promises as fsp } from 'fs';

import nock from 'nock';

import download from '../src/index.js';

const BASE_URL = 'https://tests.io/';

const siteName = 'tests-io';
const pageFileName = `${siteName}.html`;
const pageDirectory = `${siteName}_files`;

const resources = [
  'styles.css', 'main.js', 'test.png',
];

const scope = nock(BASE_URL).persist();

nock.disableNetConnect();

let tmpDirPath = '';
let expectedPageContent = '';
let resourceContents = resources.map((filename) => ({
  filename,
  filePath: path.join(pageDirectory, `${siteName}-${filename}`),
  url: `/${filename}`,
}));

const readFile = (dirpath, filename) => fsp.readFile(path.join(dirpath, filename), 'utf-8');
const buildFixturesPath = (...paths) => path.join(__dirname, '..', '__fixtures__', ...paths);

beforeEach(async () => {
  tmpDirPath = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  expectedPageContent = await readFile(buildFixturesPath('expected'), pageFileName);
  resourceContents = await Promise.all(
    resourceContents.map((resource) => readFile(buildFixturesPath('expected'), resource.filePath).then((data) => ({ ...resource, data }))),
  );

  const pageContent = await readFile(buildFixturesPath('.'), 'index.html');
  scope.get('/').reply(200, pageContent);
  resourceContents.forEach(({ url, data }) => scope.get(url).reply(200, data));
});

describe('positive cases', () => {
  test('load page', async () => {
    await download(BASE_URL, tmpDirPath);

    await expect(fsp.access(path.join(tmpDirPath, pageFileName)))
      .resolves.not.toThrow();

    const content = await readFile(tmpDirPath, pageFileName);
    expect(content).toBe(expectedPageContent.trim());
  });

  test.each(resources)('load %s resource', async (resource) => {
    await download(BASE_URL, tmpDirPath);
    const { filePath, data } = resourceContents.find((info) => info.filename === resource);

    await expect(fsp.access(path.join(tmpDirPath, filePath)))
      .resolves.not.toThrow();

    const resourceContent = await readFile(tmpDirPath, filePath);
    expect(resourceContent).toBe(data);
  });
});

describe('negative cases', () => {
  test.each([404, 500])('server %s error', async (code) => {
    scope.get(`/${code}`).reply(code);
    const url = new URL(`/${code}`, BASE_URL).toString();

    await expect(download(url, tmpDirPath))
      .rejects.toThrow(new RegExp(code));
  });

  test('file system error', async () => {
    const rootDirPath = '/sys';
    await expect(download(BASE_URL, rootDirPath))
      .rejects.toThrow();

    const filepath = buildFixturesPath('index.html');
    await expect(download(BASE_URL, filepath))
      .rejects.toThrow(/ENOTDIR/);

    await expect(download(BASE_URL, path.join(tmpDirPath, 'some-path')))
      .rejects.toThrow(/ENOENT/);
  });
});
