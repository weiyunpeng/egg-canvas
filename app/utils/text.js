'use strict';

const opentype = require('opentype.js');

/**
 * @type {object} Map containing all the fonts available for use
 */
const _fonts = {};

/**
 * The default font family to use for text
 * @type {string}
 */
// const DEFAULT_FONT_FAMILY = 'source';

/**
 * Register Font
 *
 * @param {string} binaryPath Path to the font binary file(.eot, .ttf etc.)
 * @param {string} family     The name to give the font
 * @param {number} weight     The font weight to use
 * @param {string} style      Font style
 * @param {string} variant    Font variant
 *
 * @return {void}
 */
exports.registerFont = (binaryPath, family, weight, style, variant) => {
  const font = opentype.loadSync(binaryPath);
  return (_fonts[family] = {
    binary: binaryPath,
    family,
    weight,
    style,
    variant,
    font,
  });
};
/** @ignore */
exports.debug_list_of_fonts = _fonts;

/**
 * Find Font
 *
 * Search the `fonts` array for a given font family name
 *
 * @param {string} family The name of the font family to search for
 *
 * @return {object}  字体信息
 */
function findFont(family) {
  if (_fonts[family]) return _fonts[family];
  family = Object.keys(_fonts)[0];
  return _fonts[family];
}

/**
 * Process Text Path
 *
 * @param {Context} ctx  The {@link Context} to paint on
 * @param {string}  text The text to write to the given Context
 * @param {number}  x    X position
 * @param {number}  y    Y position
 * @param {boolean} fill Indicates wether or not the font should be filled
 *
 * @return {void}
 */
exports.processTextPath = function(ctx, text, x, y, fill) {
  const font = findFont(ctx._font.family);
  if (!font) {
    console.warn('Font missing', ctx._font);
  }
  const size = ctx._font.size;
  const path = font.font.getPath(text, x, y, size);
  ctx.beginPath();
  path.commands.forEach(function(cmd) {
    switch (cmd.type) {
      case 'M':
        ctx.moveTo(cmd.x, cmd.y);
        break;
      case 'Q':
        ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
        break;
      case 'L':
        ctx.lineTo(cmd.x, cmd.y);
        break;
      case 'Z': {
        ctx.closePath();
        fill ? ctx.fill() : ctx.stroke();
        ctx.beginPath();
        break;
      }
      default:
        ctx.moveTo(cmd.x, cmd.y);
    }
  });
};

/**
 * Process Text Path
 *
 * @param {Context} ctx The {@link Context} to paint on
 * @param {string} text The name to give the font
 *
 * @return {object} text Info
 */
exports.measureText = function(ctx, text) {
  const font = findFont(ctx._font.family);
  if (!font) console.warn("WARNING. Can't find font family ", ctx._font);
  const fsize = ctx._font.size;
  const glyphs = font.font.stringToGlyphs(text);
  let advance = 0;
  glyphs.forEach(function(g) {
    advance += g.advanceWidth;
  });

  return {
    width: (advance / font.font.unitsPerEm) * fsize,
    emHeightAscent: (font.font.ascender / font.font.unitsPerEm) * fsize,
    emHeightDescent: (font.font.descender / font.font.unitsPerEm) * fsize,
  };
};
