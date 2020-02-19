'use strict';
const path = require('path');

/** @type Egg.EggPlugin */
exports.canvas = {
  enable: true,
  // package: 'egg-canvas',
  path: path.join(__dirname, '../../../../'),
};
