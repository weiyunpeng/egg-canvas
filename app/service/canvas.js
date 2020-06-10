'use strict';
const Service = require('egg').Service;
const Bitmap = require('../utils/bitmap');
const JPEG = require('jpeg-js');
const PNG_LIB = require('pngjs');
const PNG = PNG_LIB.PNG;
const text = require('../utils/text');
const uint32 = require('../utils/uint32');

class CanvasService extends Service {
  /**
     * 创建画布
     *
     * @param {number} w       Image width
     * @param {number} h       Image height
     * @param {object} options Options to be passed to {@link Bitmap}
     *
     * @return {Bitmap} 画布
     */
  make(w, h, options) {
    return new Bitmap(w, h, options);
  }

  /**
     * 加载字体
     *
     * @param {string} binaryPath Path to the font binary file(.eot, .ttf etc.)
     * @param {string} family     The name to give the font
     * @param {number} weight     The font weight to use
     * @param {string} style      Font style
     * @param {string} variant    Font variant
     *
     * @return {object} 字体信息
     */
  registerFont(binaryPath, family, weight, style, variant) {
    return text.registerFont(binaryPath, family, weight, style, variant);
  }

  /**
     * 使用流文件的方式导出png图片
     *
     * @param {Bitmap} bitmap    An instance of {@link Bitmap} to be encoded to PNG, `bitmap.data` must be a buffer of raw PNG data
     * @param {Stream} outstream The stream to write the PNG file to
     *
     * @return {Promise<void>} png图片
     */
  async encodePNGToStream(bitmap, outstream) {
    return new Promise((res, rej) => {
      if (
        !bitmap.hasOwnProperty('data') ||
                !bitmap.hasOwnProperty('width') ||
                !bitmap.hasOwnProperty('height')
      ) {
        rej(new TypeError('Invalid bitmap image provided'));
      }
      const png = new PNG({
        width: bitmap.width,
        height: bitmap.height,
      });

      for (let i = 0; i < bitmap.width; i++) {
        for (let j = 0; j < bitmap.height; j++) {
          const rgba = bitmap.getPixelRGBA(i, j);
          const n = (j * bitmap.width + i) * 4;
          const bytes = uint32.getBytesBigEndian(rgba);
          for (let k = 0; k < 4; k++) {
            png.data[n + k] = bytes[k];
          }
        }
      }

      png.on('error', err => {
        rej(err);
      })
        .pack()
        .pipe(outstream)
        .on('finish', () => {
          res();
        })
        .on('error', err => {
          rej(err);
        });
    });
  }

  /**
     *
     * 使用流文件的方式导出jpg图片
     *
     * @param {Bitmap} img       An instance of {@link Bitmap} to be encoded to JPEG, `img.data` must be a buffer of raw JPEG data
     * @param {Stream} outstream The stream to write the raw JPEG buffer to
     * @param {Int} Number between 0 and 100 setting the JPEG quality
     * @return {Promise<void>} jpg图片
     */
  async encodeJPEGToStream(img, outstream, quality) {
    quality = quality || 90;
    return new Promise((res, rej) => {
      if (
        !img.hasOwnProperty('data') ||
                !img.hasOwnProperty('width') ||
                !img.hasOwnProperty('height')
      ) {
        rej(new TypeError('Invalid bitmap image provided'));
      }
      const data = {
        data: img.data,
        width: img.width,
        height: img.height,
      };
      outstream.on('error', err => rej(err));
      outstream.write(JPEG.encode(data, quality).data, () => {
        outstream.end();
        res();
      });
    });
  }

  /**
     *
     * 将一个jpeg图片转成流文件形式
     *
     * @param {Stream} data A readable stream to decode JPEG data from
     *
     * @return {Promise<Bitmap>} jpeg流文件
     */
  async decodeJPEGFromStream(data) {
    return new Promise((res, rej) => {
      try {
        const chunks = [];
        data.on('data', chunk => chunks.push(chunk));
        data.on('end', () => {
          const buf = Buffer.concat(chunks);
          const rawImageData = JPEG.decode(buf);
          const bitmap = new Bitmap(
            rawImageData.width,
            rawImageData.height
          );
          for (
            let x_axis = 0;
            x_axis < rawImageData.width;
            x_axis++
          ) {
            for (
              let y_axis = 0;
              y_axis < rawImageData.height;
              y_axis++
            ) {
              const n =
                                (y_axis * rawImageData.width + x_axis) * 4;
              bitmap.setPixelRGBA_i(
                x_axis,
                y_axis,
                rawImageData.data[n + 0],
                rawImageData.data[n + 1],
                rawImageData.data[n + 2],
                rawImageData.data[n + 3]
              );
            }
          }
          res(bitmap);
        });
        data.on('error', err => {
          rej(err);
        });
      } catch (e) {
        console.log(e);
        rej(e);
      }
    });
  }

  /**
     *
     * 将一个png图片转成流文件形式
     *
     * @param {Stream} instream A readable stream containing raw PNG data
     *
     * @return {Promise<Bitmap>} png流文件
     */
  async decodePNGFromStream(instream) {
    return new Promise((res, rej) => {
      instream
        .pipe(new PNG())
        .on('parsed', function() {
          const bitmap = new Bitmap(
            this.width,
            this.height
          );
          for (let i = 0; i < bitmap.data.length; i++) {
            bitmap.data[i] = this.data[i];
          }
          res(bitmap);
        })
        .on('error', function(err) {
          rej(err);
        });
    });
  }
}

module.exports = CanvasService;
