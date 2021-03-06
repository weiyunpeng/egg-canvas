# egg-canvas

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-canvas.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-canvas
[travis-image]: https://img.shields.io/travis/weiyunpeng/egg-canvas.svg?style=flat-square
[travis-url]: https://travis-ci.org/weiyunpeng/egg-canvas
[codecov-image]: https://img.shields.io/codecov/c/github/weiyunpeng/egg-canvas.svg?style=flat-square
[codecov-url]: https://codecov.io/gh/weiyunpeng/egg-canvas?branch=master
[david-image]: https://img.shields.io/david/weiyunpeng/egg-canvas.svg?style=flat-square
[david-url]: https://david-dm.org/weiyunpeng/egg-canvas
[snyk-image]: https://snyk.io/test/npm/egg-canvas/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-canvas
[download-image]: https://img.shields.io/npm/dm/egg-canvas.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-canvas

[![codecov](https://codecov.io/gh/weiyunpeng/egg-canvas/branch/master/graph/badge.svg)](https://codecov.io/gh/weiyunpeng/egg-canvas)

<!--
Description here.
-->

## Install

```bash
$ npm i egg-canvas --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.canvas = {
  enable: true,
  package: 'egg-canvas',
};
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.canvas = {
};
```

see [config/config.default.js](config/config.default.js) for more detail.

## Example

见单元测试

## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)
