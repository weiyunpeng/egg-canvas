/* eslint-disable */
'use strict';

const Line = require('./Line');
const NAMED_COLORS = require('./named_colors');
const Point = require('./Point');
const TEXT = require('./text');
const trans = require('./transform');
const uint32 = require('./uint32');
const G = require('./Gradient');

/**
 * Enum for path commands (used for encoding and decoding lines, curves etc. to and from a path)
 * @enum {string}
 */
const PATH_COMMAND = {
  MOVE: 'm',
  LINE: 'l',
  QUADRATIC_CURVE: 'q',
  BEZIER_CURVE: 'b',
};

/**
 * Used for drawing rectangles, text, images and other objects onto the canvas element. It provides the 2D rendering context for a drawing surface.
 *
 * It has the same API as [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) from the HTML5 canvas spec
 *
 * @class Context
 */
class Context {
  /**
   * Creates a new pure image Context
   *
   * @param {Bitmap} bitmap An instance of the {@link Bitmap} class
   * @memberof Context
   */
  constructor(bitmap) {
    /**
     * An instance of the {@link Bitmap} class. Used for direct pixel manipulation(for example setting pixel colours)
     * @type {Bitmap}
     */
    this.bitmap = bitmap;

    /**
     *  A 32-bit unsigned integer (uint32) number representing the fill color of the 2D drawing context
     *
     * @type {number}
     */
    this._fillColor = NAMED_COLORS.black;

    /**
     * @type {number}
     */
    this._strokeColor = NAMED_COLORS.black;

    /**
     * @type {number}
     */
    this._lineWidth = 1;

    /**
     * @type {number}
     */
    this._globalAlpha = 1;

    /**
     * @type {Transform}
     */
    this.transform = new trans.Transform();

    /**
     * @type {object} Plain js object wrapping the font name and size
     */
    this._font = {
      family: 'invalid',
      size: 12,
    };

    /** @type {string} horizontal text alignment, one of start, end, left, center, right. start is the default */
    this.textAlign = 'start';

    /** @type {string} vertical text alignment, relative to the baseline. one of top, middle, alphabetic(default) and bottom. */
    this.textBaseline = 'alphabetic';

    /**
     * @type {boolean} Enable or disable image smoothing(anti-aliasing)
     */
    this.imageSmoothingEnabled = true;

    /**
     * @type {?any}
     */
    this._clip = null;

    /**
     * @type {string}
     */
    this._fillStyle_text = '';

    /**
     * @type {string}
     */
    this._strokeStyle_text = '';
  }

  /**
   * The color or style to use inside shapes. The default is #000 (black).
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillStyle
   * @type {string}
   */
  get fillStyle() {
    return this._fillStyle_text;
  }

  /**
   * @param {string} val
   * @example ctx.fillStyle = 'rgba(0, 25, 234, 0.6)';
   */
  set fillStyle(val) {
    if (val instanceof G.CanvasGradient) {
      this._fillColor = val;
    } else {
      this._fillColor = Context.colorStringToUint32(val);
      this._fillStyle_text = val;
    }
  }

  /**
   * The color or style to use for the lines around shapes. The default is #000 (black).
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/strokeStyle
   * @type {string}
   */
  get strokeStyle() {
    return this._strokeStyle_text;
  }

  /**
   * @param {number} val
   * @example ctx.strokeStyle = 'rgba(0, 25, 234, 0.6)';
   */
  set strokeStyle(val) {
    this._strokeColor = Context.colorStringToUint32(val);
    this._strokeStyle_text = val;
  }

  /**
   * The thickness of lines in space units. When getting, it returns the current value (1.0 by default). When setting, zero, negative, `Infinity` and `NaN` values are ignored; otherwise the current value is set to the new value.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineWidth
   * @type {number}
   */
  get lineWidth() {
    return this._lineWidth;
  }

  /**
   * @param {string} val
   * @example ctx.lineWidth = 15;
   */
  set lineWidth(val) {
    this._lineWidth = val;
  }

  /**
   * The alpha value that is applied to shapes and images before they are drawn onto the canvas. The value is in the range from 0.0 (fully transparent) to 1.0 (fully opaque).
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalAlpha
   * @type {Boolean}
   */
  get globalAlpha() {
    return this._globalAlpha;
  }

  /**
   * @param {boolean} val
   * @example ctx.globalAlpha = 1;
   */
  set globalAlpha(val) {
    this._globalAlpha = clamp(val, 0, 1);
  }

  /**
   * The current text style being used when drawing text. This string uses the same syntax as the CSS font specifier
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font
   * @type {object}
   * @property {number} size   The an integer representing the font size to use
   * @property {string} family The font family to set
   */
  get font() {}

  /**
   * @param {object} font
   * @example ctx.globalAlpha = 1;
   */
  set font(val) {
    const n = val.trim().indexOf(' ');
    const font_size = parseInt(val.slice(0, n));
    const font_name = val.slice(n).trim();

    this._font.family = font_name;
    this._font.size = font_size;
  }

  createLinearGradient(x0, y0, x1, y1) {
    return new G.LinearGradient(x0, y0, x1, y1);
  }
  createRadialGradient(x0, y0) {
    return new G.RadialGradient(x0, y0);
  }

  /**
   * Saves the entire state of the canvas by pushing the current state onto a stack
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/save
   *
   * @return {void}
   *
   * @memberof Context
   */
  save() {
    this.transform.save();
  }

  /**
   * Adds a translation transformation by moving the canvas and its origin `x` horizontally and `y` vertically on the grid
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/translate
   *
   * @param {number} x X position
   * @param {number} y Y position
   *
   * @return {void}
   *
   * @memberof Context
   */
  translate(x, y) {
    this.transform.translate(x, y);
  }

  /**
   * Add a rotation to the transformation matrix. The angle argument represents a clockwise rotation angle and is expressed in adians
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/rotate
   *
   * @param {number} angle Degrees of rotation (in radians)
   *
   * @return {void}
   *
   * @memberof Context
   */
  rotate(angle) {
    this.transform.rotate(angle);
  }

  /**
   * Adds a scaling transformation to the canvas units by `x` horizontally and by `y` vertically
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/rotate
   *
   * @param {number} sx Scale X amount
   * @param {number} sy Scale Y amount
   *
   * @return {void}
   *
   * @memberof Context
   */
  scale(sx, sy) {
    this.transform.scale(sx, sy);
  }

  /**
   * Restores the most recently saved canvas state by popping the top entry in the drawing state stack. If there is no saved state, this method does nothing.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/restore
   *
   * @return {void}
   *
   * @memberof Context
   */
  restore() {
    this.transform.restore();
  }

  /**
   * Draws a filled rectangle whose starting point is at the coordinates `(x, y)` with the specified width and height and whose style is determined by the fillStyle attribute.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillRect
   *
   * @param {number} x X position
   * @param {number} y Y position
   * @param {number} w Width
   * @param {number} h Height
   *
   * @return {void}
   *
   * @memberof Context
   */
  fillRect(x, y, w, h) {
    for (let i = x; i < x + w; i++) {
      for (let j = y; j < y + h; j++) {
        this.fillPixel(i, j);
      }
    }
  }

  /**
   * Sets all pixels in the rectangle defined by starting point `(x, y)` and size `(width, height)` to transparent black, erasing any previously drawn content.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/clearRect
   *
   * @param {number} x X position
   * @param {number} y Y position
   * @param {number} w Width
   * @param {number} h Height
   *
   * @return {void}
   *
   * @memberof Context
   */
  clearRect(x, y, w, h) {
    for (let i = x; i < x + w; i++) {
      for (let j = y; j < y + h; j++) {
        this.bitmap.setPixelRGBA(i, j, 0x00000000);
      }
    }
  }

  /**
   * Paints a rectangle which has a starting point at `(x, y)` and has a `w` width and an `h` height onto the canvas, using the current stroke style.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/strokeRect
   *
   * @param {number} x X position
   * @param {number} y Y position
   * @param {number} w Width
   * @param {number} h Height
   *
   * @return {void}
   *
   * @memberof Context
   */
  strokeRect(x, y, w, h) {
    for (let i = x; i < x + w; i++) {
      this.bitmap.setPixelRGBA(i, y, this._strokeColor);
      this.bitmap.setPixelRGBA(i, y + h, this._strokeColor);
    }
    for (let j = y; j < y + h; j++) {
      this.bitmap.setPixelRGBA(x, j, this._strokeColor);
      this.bitmap.setPixelRGBA(x + w, j, this._strokeColor);
    }
  }

  /**
   * Set the background colour of a single pixel denoted by the `x` and `y` co-ordinates
   *
   * @param {number} x The x axis of the pixel
   * @param {number} y The y axis of the pixel
   *
   * @return {void}
   *
   * @memberof Context
   */
  fillPixel(x, y) {
    if (!this.pixelInsideClip(x, y)) {
      return;
    }

    const new_pixel = this.calculateRGBA(x, y);
    const old_pixel = this.bitmap.getPixelRGBA(x, y);
    const final_pixel = this.composite(x, y, old_pixel, new_pixel);

    this.bitmap.setPixelRGBA(x, y, final_pixel);
  }

  /**
   * Paints a pixel which has an x axis position of `x` and a y axis position of `y`
   *
   * @param {number} x The x axis of the pixel to stroke
   * @param {number} y The y axis of the pixel to stroke
   *
   * @return {void}
   *
   * @memberof Context
   */
  strokePixel(x, y) {
    if (!this.pixelInsideClip(x, y)) {
      return;
    }

    const new_pixel = this.calculateRGBA_stroke(x, y);
    const old_pixel = this.bitmap.getPixelRGBA(x, y);
    const final_pixel = this.composite(x, y, old_pixel, new_pixel);

    this.bitmap.setPixelRGBA(x, y, final_pixel);
  }

  /**
   * Fill Pixel With Color
   *
   * @param {number} x   The x axis of the pixel to fill
   * @param {number} y   The y axis of the pixel to fill
   * @param {number} col
   *
   * @ignore
   *
   * @return {void}
   *
   * @memberof Context
   */
  fillPixelWithColor(x, y, col) {
    if (!this.pixelInsideClip(x, y)) {
      return;
    }

    const new_pixel = col;
    const old_pixel = this.bitmap.getPixelRGBA(x, y);
    const final_pixel = this.composite(x, y, old_pixel, new_pixel);

    this.bitmap.setPixelRGBA(x, y, final_pixel);
  }

  /**
   * Composite
   *
   * @param {number} i Unused
   * @param {number} j Unused
   * @param {number} old_pixel
   * @param {number} new_pixel
   *
   * @ignore
   *
   * @return {void}
   *
   * @memberof Context
   */
  composite(i, j, old_pixel, new_pixel) {
    const old_rgba = uint32.getBytesBigEndian(old_pixel);
    const new_rgba = uint32.getBytesBigEndian(new_pixel);

    // convert to range of 0->1
    const A = new_rgba.map(b => b / 255);
    const B = old_rgba.map(b => b / 255);

    // multiply by global alpha
    A[3] = A[3] * this._globalAlpha;

    // do a standard composite (SRC_OVER) on RGB values
    function compit(ca, cb, aa, ab) {
      return (ca * aa + cb * ab * (1 - aa)) / (aa + ab * (1 - aa));
    }
    const C = A.slice(0, 3).map((comp, i) => compit(A[i], B[i], A[3], B[3]));

    // convert back to 0->255 range
    const Cf = C.map(c => c * 255);

    // convert back to int
    return uint32.fromBytesBigEndian(
      Cf[0],
      Cf[1],
      Cf[2], // R, G, B,
      Math.max(old_rgba[3], new_rgba[3]) // alpha
    );
  }

  /**
   * Calculate RGBA
   *
   * @param {number} x X position
   * @param {number} y Y position
   *
   * @ignore
   *
   * @return {number}
   *
   * @memberof Context
   */
  calculateRGBA(x, y) {
    if (this._fillColor instanceof G.CanvasGradient) {
      return this._fillColor.colorAt(x, y);
    }
    return this._fillColor;
  }

  /**
   * Calculate RGBA Stroke
   *
   * @param {number} x X position
   * @param {number} y Y position
   *
   * @ignore
   *
   * @return {number}
   *
   * @memberof Context
   */
  calculateRGBA_stroke(x, y) {
    return this._strokeColor;
  }

  /**
   * Get Image Data
   *
   * @param {number} x X position
   * @param {number} y Y position
   * @param {number} w Width
   * @param {number} h Height
   *
   * @ignore
   *
   * @return {Bitmap}
   *
   * @memberof Context
   */
  getImageData(x, y, w, h) {
    return this.bitmap;
  }

  /**
   * *Put Image Data
   *
   * @param {number} id Image ID
   * @param {number} x  X position
   * @param {number} y  Y position
   *
   * @ignore
   *
   * @return {void}
   *
   * @memberof Context
   */
  putImageData(id, x, y) {
    throw new Error('Method not yet implemented');
  }

  /**
   * Provides different ways to draw an image onto the canvas.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
   *
   * @param {Bitmap} bitmap An instance of the {@link Bitmap} class to use for drawing
   * @param {number} sx     The X coordinate of the top left corner of the sub-rectangle of the source image to draw into the destination context.
   * @param {number} sy     The Y coordinate of the top left corner of the sub-rectangle of the source image to draw into the destination context.
   * @param {number} sw     The width of the sub-rectangle of the source {@link Bitmap} to draw into the destination context. If not specified, the entire rectangle from the coordinates specified by `sx` and `sy` to the bottom-right corner of the image is used.
   * @param {number} sh     The height of the sub-rectangle of the source {@link Bitmap} to draw into the destination context.
   * @param {number} dx     The X coordinate in the destination canvas at which to place the top-left corner of the source {@link Bitmap}
   * @param {number} dy     The Y coordinate in the destination canvas at which to place the top-left corner of the source {@link Bitmap}
   * @param {number} dw     The width to draw the {@link Bitmap} in the destination canvas. This allows scaling of the drawn image. If not specified, the image is not scaled in width when drawn
   * @param {number} dh     The height to draw the {@link Bitmap} in the destination canvas. This allows scaling of the drawn image. If not specified, the image is not scaled in height when drawn
   *
   * @return {void}
   *
   * @memberof Context
   */
  drawImage(bitmap, sx, sy, sw, sh, dx, dy, dw, dh) {
    // two argument form
    if (typeof sw === 'undefined') {
      return this.drawImage(
        bitmap,
        0,
        0,
        bitmap.width,
        bitmap.height,
        sx,
        sy,
        bitmap.width,
        bitmap.height
      );
    }
    // four argument form
    if (typeof dx === 'undefined') {
      return this.drawImage(
        bitmap,
        0,
        0,
        bitmap.width,
        bitmap.height,
        sx,
        sy,
        sw,
        sh
      );
    }
    for (let i = 0; i < dw; i++) {
      const tx = i / dw;
      const ssx = Math.floor(tx * sw) + sx;
      for (let j = 0; j < dh; j++) {
        const ty = j / dh;
        const ssy = sy + Math.floor(ty * sh);
        const rgba = bitmap.getPixelRGBA(ssx, ssy);
        this.bitmap.setPixelRGBA(dx + i, dy + j, rgba);
      }
    }
  }

  /**
   * Starts a new path by emptying the list of sub-paths. Call this method when you want to create a new path.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/beginPath
   *
   * @return {void}
   *
   * @memberof Context
   */
  beginPath() {
    /**
     * @type {Array}
     */
    this.path = [];
    this._closed = false;
  }

  /**
   * Moves the starting point of a new sub-path to the (x, y) coordinates.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/moveTo
   *
   * @param {number} x The x axis of the point.
   * @param {number} y The y axis of the point.
   *
   * @return {void}
   *
   * @memberof Context
   * */
  moveTo(x, y) {
    return this._moveTo(new Point(x, y));
  }

  /**
   * Moves the starting point of a new sub-path to the (x, y) coordinates.
   *
   * @param {Point} pt A `point` object representing a set of co-ordinates to move the "pen" to.
   *
   * @example
   * //All of the following are valid:
   * this._moveTo({x: 20, y: 40})
   * this._moveTo(new Point(20, 40))
   *
   * @return {void}
   *
   * @memberof Context
   * */
  _moveTo(pt) {
    pt = this.transform.transformPoint(pt);
    /**
     * Set the starting co-ordinates for the path starting point
     * @type {Point}
     */
    this.pathstart = pt;
    this.path.push([ PATH_COMMAND.MOVE, pt ]);
  }

  /**
   * Connects the last point in the sub-path to the x, y coordinates with a straight line (but does not actually draw it).
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineTo
   *
   * @param {number} x The x axis of the coordinate for the end of the line.
   * @param {number} y The y axis of the coordinate for the end of the line.
   *
   * @return {void}
   *
   * @memberof Context
   */
  lineTo(x, y) {
    return this._lineTo(new Point(x, y));
  }

  /**
   * Connects the last point in the sub-path to the x, y coordinates with a straight line (but does not actually draw it).
   *
   * @param {Point} pt A point object to draw a line to from the current set of co-ordinates
   *
   * @return {void}
   *
   * @memberof Context
   */
  _lineTo(pt) {
    this.path.push([ PATH_COMMAND.LINE, this.transform.transformPoint(pt) ]);
  }

  /**
   * Adds a quadratic Bézier curve to the path. It requires two points. The first point is a control point and the second one is the end point. The starting point is the last point in the current path, which can be changed using moveTo() before creating the quadratic Bézier curve.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/quadraticCurveTo
   *
   * @param {number} cp1x The x axis of the coordinate for the control point.
   * @param {number} cp1y The y axis of the coordinate for the control point.
   * @param {number} x    The x axis of the coordinate for the end point.
   * @param {number} y    The y axis of the coordinate for the end point.
   *
   * @return {void}
   *
   * @memberof Context
   */
  quadraticCurveTo(cp1x, cp1y, x, y) {
    const cp1 = this.transform.transformPoint(new Point(cp1x, cp1y));
    const pt = this.transform.transformPoint(new Point(x, y));
    this.path.push([ PATH_COMMAND.QUADRATIC_CURVE, cp1, pt ]);
  }

  /**
   * Adds a cubic Bézier curve to the path. It requires three points. The first two points are control points and the third one is the end point. The starting point is the last point in the current path, which can be changed using moveTo() before creating the Bézier curve.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/bezierCurveTo
   *
   * @param {number} cp1x The x axis of the coordinate for the first control point.
   * @param {number} cp1y The y axis of the coordinate for first control point.
   * @param {number} cp2x The x axis of the coordinate for the second control point.
   * @param {number} cp2y The y axis of the coordinate for the second control point.
   * @param {number} x    The x axis of the coordinate for the end point.
   * @param {number} y    The y axis of the coordinate for the end point.
   *
   * @return {void}
   *
   * @memberof Context
   */
  bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
    this._bezierCurveTo(
      new Point(cp1x, cp1y),
      new Point(cp2x, cp2y),
      new Point(x, y)
    );
  }

  /**
   * Bezier Curve To
   *
   * @param {number} cp1 Curve point 1
   * @param {number} cp2 Curve point 2
   * @param {Point}  pt
   *
   * @return {void}
   *
   * @memberof Context
   * */
  _bezierCurveTo(cp1, cp2, pt) {
    cp1 = this.transform.transformPoint(cp1);
    cp2 = this.transform.transformPoint(cp2);
    pt = this.transform.transformPoint(pt);
    this.path.push([ PATH_COMMAND.BEZIER_CURVE, cp1, cp2, pt ]);
  }

  /**
   * Adds an arc to the path which is centered at (x, y) position with radius r starting at startAngle and ending at endAngle going in the given direction by anticlockwise (defaulting to clockwise).
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/arc
   *
   * @param {number}  x         The x coordinate of the arc's center
   * @param {number}  y         The y coordinate of the arc's center
   * @param {number}  rad       The arc's radius
   * @param {number}  start     The angle at which the arc starts, measured clockwise from the positive x axis and expressed in radians
   * @param {number}  end       The angle at which the arc ends, measured clockwise from the positive x axis and expressed in radians
   * @param {boolean} anticlockwise A boolean which, if true, causes the arc to be drawn anticlockwise between the two angles.
   *
   * @return {void}
   *
   * @memberof Context
   */
  arc(x, y, rad, start, end, anticlockwise) {
    function calcPoint(angle) {
      const px = x + Math.cos(angle) * rad;
      const py = y + Math.sin(angle) * rad;
      return new Point(px, py);
    }

    if (start > end) end += Math.PI * 2;

    const step = Math.PI / 16;
    if (anticlockwise) {
      const temp = end;
      end = start + Math.PI * 2;
      start = temp;
    }
    this._moveTo(calcPoint(start));
    for (let a = start; a <= end; a += step) {
      this._lineTo(calcPoint(a));
    }
    this._lineTo(calcPoint(end));
  }

  /**
   * Arc To
   *
   * @ignore
   *
   * @throws {Error} Method is not yet implemented
   *
   * @memberof Context
   */
  arcTo() {
    throw new Error('arcTo not yet supported');
  }

  /**
   * Rect
   *
   * @ignore
   *
   * @throws {Error} Method is not yet implemented
   *
   * @memberof Context
   */
  rect() {
    throw new Error('rect not yet supported');
  }

  /**
   * Ellipse
   *
   * @ignore
   *
   * @throws {Error} Method is not yet implemented
   *
   * @memberof Context
   */
  ellipse() {
    throw new Error('ellipse not yet supported');
  }

  /**
   * Turns the path currently being built into the current clipping path.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/clip
   *
   * @return {void}
   *
   * @memberof Context
   */
  clip() {
    this._clip = pathToLines(this.path);
  }

  /**
   * Measure Text
   *
   * @ignore
   *
   * @throws {Error} Method is not yet implemented
   *
   * @memberof Context
   */
  measureText(string) {
    return TEXT.measureText(this, string);
  }

  /**
   * Causes the point of the pen to move back to the start of the current sub-path. It tries to add a straight line (but does not actually draw it) from the current point to the start. If the shape has already been closed or has only one point, this function does nothing.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/closePath
   *
   * @return {void}
   *
   * @memberof Context
   */
  closePath() {
    if (!this._closed) {
      this.path.push([ PATH_COMMAND.LINE, this.pathstart ]);
      this._closed = true;
    }
  }

  /**
   * Strokes the current or given path with the current stroke style
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/stroke
   *
   * @return {void}
   *
   * @memberof Context
   */
  stroke() {
    pathToLines(this.path).forEach(line => this.drawLine(line));
  }

  /**
   * Draw a line using the correct anti-aliased, or non-anti-aliased line drawing function based on the value of {@link imageSmoothingEnabled}
   *
   * @param {Line} line A set of co-ordinates representing the start and end of the line. You can also pass a plain js object if you wish
   * @example
   * //All of the following are valid:
   * ctx.drawLine({start: {x: 20, y:42}, end: {x: 20, y:90}})
   * ctx.drawLine(new Line(new Point(20, 42), new Point(20, 90)))
   * ctx.drawLine(new Line(20, 42, 20, 90))
   *
   * @return {void}
   *
   * @memberof Context
   */
  drawLine(line) {
    this.imageSmoothingEnabled
      ? this.drawLine_aa(line)
      : this.drawLine_noaa(line);
  }

  /**
   *
   * Draw a line without anti-aliasing using Bresenham's algorithm
   *
   * @param {Line} line A set of co-ordinates representing the start and end of the line. You can also pass a plain js object if you wish
   * @example
   * //All of the following are valid:
   * ctx.drawLine({start: {x: 20, y:42}, end: {x: 20, y:90}})
   * ctx.drawLine(new Line(new Point(20, 42), new Point(20, 90)))
   * ctx.drawLine(new Line(20, 42, 20, 90))
   *
   * @return {void}
   *
   * @memberof Context
   */
  drawLine_noaa(line) {
    // Bresenham's from Rosetta Code
    // http://rosettacode.org/wiki/Bitmap/Bresenham's_line_algorithm#JavaScript
    let x0 = Math.floor(line.start.x);
    let y0 = Math.floor(line.start.y);
    const x1 = Math.floor(line.end.x);
    const y1 = Math.floor(line.end.y);
    const dx = Math.abs(x1 - x0),
      sx = x0 < x1 ? 1 : -1;
    const dy = Math.abs(y1 - y0),
      sy = y0 < y1 ? 1 : -1;
    let err = (dx > dy ? dx : -dy) / 2;

    while (true) {
      this.strokePixel(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = err;
      if (e2 > -dx) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dy) {
        err += dx;
        y0 += sy;
      }
    }
  }

  /**
   * Draw Line Anti-aliased
   *
   * Draw anti-aliased line using Bresenham's algorithm
   *
   * @see http://members.chello.at/~easyfilter/bresenham.html
   *
   * @param {Line} line A set of co-ordinates representing the start and end of the line. You can also pass a plain js object if you wish
   * @example
   * //All of the following are valid:
   * ctx.drawLine({start: {x: 20, y:42}, end: {x: 20, y:90}})
   * ctx.drawLine(new Line(new Point(20, 42), new Point(20, 90)))
   * ctx.drawLine(new Line(20, 42, 20, 90))
   *
   * @memberof Context
   */
  drawLine_aa(line) {
    let width = this._lineWidth;
    let x0 = Math.floor(line.start.x);
    let y0 = Math.floor(line.start.y);
    const x1 = Math.floor(line.end.x);
    const y1 = Math.floor(line.end.y);
    const dx = Math.abs(x1 - x0),
      sx = x0 < x1 ? 1 : -1;
    const dy = Math.abs(y1 - y0),
      sy = y0 < y1 ? 1 : -1;

    let err = dx - dy,
      e2,
      x2,
      y2;
    const ed = dx + dy === 0 ? 1 : Math.sqrt(dx * dx + dy * dy);
    const rgb = uint32.and(this._strokeColor, 0xffffff00);
    const a1 = uint32.and(this._strokeColor, 0x000000ff);
    for (width = (width + 1) / 2; ;) {
      const alpha = ~~Math.max(
        0,
        255 * (Math.abs(err - dx + dy) / ed - width + 1)
      );
      const a2 = 255 - alpha;
      const color = uint32.or(rgb, (a1 * a2) / 255);
      this.fillPixelWithColor(x0, y0, color);
      e2 = err;
      x2 = x0;
      if (2 * e2 >= -dx) {
        for (
          e2 += dy, y2 = y0;
          e2 < ed * width && (y1 !== y2 || dx > dy);
          e2 += dx
        ) {
          const alpha = ~~Math.max(0, 255 * (Math.abs(e2) / ed - width + 1));
          const a2 = 255 - alpha;
          const color = uint32.or(rgb, (a1 * a2) / 255);
          this.fillPixelWithColor(x0, (y2 += sy), color);
        }
        if (x0 === x1) break;
        e2 = err;
        err -= dy;
        x0 += sx;
      }
      if (2 * e2 <= dy) {
        for (
          e2 = dx - e2;
          e2 < ed * width && (x1 !== x2 || dx < dy);
          e2 += dy
        ) {
          const alpha = ~~Math.max(0, 255 * (Math.abs(e2) / ed - width + 1));
          const a2 = 255 - alpha;
          const color = uint32.or(rgb, (a1 * a2) / 255);
          this.fillPixelWithColor((x2 += sx), y0, color);
        }
        if (y0 === y1) break;
        err += dx;
        y0 += sy;
      }
    }
  }

  /**
   * Fills the current or given path with the current fill style. Uses {@link fill_aa} and {@link fill_noaa} depending on the the value of {@link imageSmoothingEnabled}
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fill
   *
   * @return {void}
   *
   * @memberof Context
   */
  fill() {
    this.imageSmoothingEnabled ? this.fill_aa() : this.fill_noaa();
  }

  /**
   * Fill Anti-aliased
   *
   * @return {void}
   *
   * @memberof Context
   */
  fill_aa() {
    if (!this._closed) this.closePath();
    // get just the color part
    const rgb = uint32.and(this._fillColor, 0xffffff00);
    const lines = pathToLines(this.path);
    const bounds = calcMinimumBounds(lines);

    const startY = Math.min(bounds.y2 - 1, this.bitmap.height);
    const endY = Math.max(bounds.y, 0);

    for (let j = startY; j >= endY; j--) {
      const ints = calcSortedIntersections(lines, j);
      // fill between each pair of intersections
      // if(ints.length %2 !==0) console.log("warning. uneven number of intersections");
      for (let i = 0; i < ints.length; i += 2) {
        const fstartf = fract(ints[i]);
        const fendf = fract(ints[i + 1]);
        const start = Math.floor(ints[i]);
        const end = Math.floor(ints[i + 1]);
        for (let ii = start; ii <= end; ii++) {
          if (ii == start) {
            // first
            var int = uint32.or(rgb, (1 - fstartf) * 255);
            this.fillPixelWithColor(ii, j, int);
            continue;
          }
          if (ii == end) {
            // last
            var int = uint32.or(rgb, fendf * 255);
            this.fillPixelWithColor(ii, j, int);
            continue;
          }
          // console.log("filling",ii,j);
          this.fillPixelWithColor(ii, j, this._fillColor);
        }
      }
    }
  }

  /**
   * Fill No Anti-aliased
   *
   * @return {void}
   *
   * @memberof Context
   */
  fill_noaa() {
    // get just the color part
    const rgb = uint32.and(this._fillColor, 0xffffff00);
    const lines = pathToLines(this.path);
    const bounds = calcMinimumBounds(lines);
    for (let j = bounds.y2 - 1; j >= bounds.y; j--) {
      const ints = calcSortedIntersections(lines, j);
      // fill between each pair of intersections
      for (let i = 0; i < ints.length; i += 2) {
        const start = Math.floor(ints[i]);
        const end = Math.floor(ints[i + 1]);
        for (let ii = start; ii <= end; ii++) {
          if (ii == start) {
            // first
            this.fillPixel(ii, j);
            continue;
          }
          if (ii == end) {
            // last
            this.fillPixel(ii, j);
            continue;
          }
          this.fillPixel(ii, j);
        }
      }
    }
  }

  /**
   * Pixel Inside Clip
   *
   * Even/odd rule. https://en.wikipedia.org/wiki/Point_in_polygon
   * technically this is not correct as the default algorithm for
   * html canvas is supposed to be the non-zero winding rule instead
   *
   * @see https://en.wikipedia.org/wiki/Point_in_polygon
   *
   * @param {number} x
   * @param {number} y
   *
   * @return {void}
   *
   * @memberof Context
   */
  pixelInsideClip(x, y) {
    if (!this._clip) return true;
    // turn into a list of lines
    // calculate intersections with a horizontal line at j
    const ints = calcSortedIntersections(this._clip, y);
    // find the intersections to the left of i (where x < i)
    const left = ints.filter(inter => inter < x);
    if (left.length % 2 === 0) {
      return false;
    }
    return true;

  }

  /**
   *  Draws a text string at the specified coordinates, filling the string's characters with the current foreground color
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillText
   *
   * @param {string} text A string specifying the text string to render into the context. The text is rendered using the settings specified by {@link font}.
   * @param {number} x    The x -coordinate of the point at which to begin drawing the text, in pixels.
   * @param {number} y    The y-coordinate of the point at which to begin drawing the text, in pixels.
   *
   * @return {void}
   *
   * @memberof Context
   */
  fillText(text, x, y) {
    TEXT.processTextPath(
      this,
      text,
      x,
      y,
      true,
      this.textAlign,
      this.textBaseline
    );
  }

  /**
   * Draws the outlines of the characters of a specified text string at the given (x, y) position.
   *
   * @param {string} text The text to draw using the current {@link font} values.
   * @param {number} x    The x axis of the coordinate for the text starting point.
   * @param {number} y    The y axis of the coordinate for the text starting point.
   *
   * @return {void}
   *
   * @memberof Context
   */
  strokeText(text, x, y) {
    TEXT.processTextPath(
      this,
      text,
      x,
      y,
      false,
      this.textAlign,
      this.textBaseline
    );
  }

  /**
   * Color String To Unint32
   *
   * Convert a color string to Uint32 notation
   *
   * @static
   * @param {string} str The color string to convert
   *
   * @return {number}
   *
   * @example
   * var uInt32 = colorStringToUint32('#FF00FF');
   * console.log(uInt32); // Prints 4278255615
   *
   * @memberof Context
   */
  static colorStringToUint32(str) {
    if (!str) return 0x000000;
    // hex values always get 255 for the alpha channel
    if (str.indexOf('#') == 0) {
      let int = uint32.toUint32(parseInt(str.substring(1), 16));
      int = uint32.shiftLeft(int, 8);
      int = uint32.or(int, 0xff);
      return int;
    }
    if (str.indexOf('rgba') == 0) {
      var parts = str
        .trim()
        .substring(4)
        .replace('(', '')
        .replace(')', '')
        .split(',');
      return uint32.fromBytesBigEndian(
        parseInt(parts[0]),
        parseInt(parts[1]),
        parseInt(parts[2]),
        Math.floor(parseFloat(parts[3]) * 255)
      );
    }
    if (str.indexOf('rgb') == 0) {
      var parts = str
        .trim()
        .substring(3)
        .replace('(', '')
        .replace(')', '')
        .split(',');
      return uint32.fromBytesBigEndian(
        parseInt(parts[0]),
        parseInt(parts[1]),
        parseInt(parts[2]),
        255
      );
    }
    if (NAMED_COLORS[str]) {
      return NAMED_COLORS[str];
    }
    throw new Error('unknown style format: ' + str);
  }
}
module.exports = Context;

/**
 * Returns the decimal portion of a given floating point number
 *
 * @param {number} v The number to return the declimal fration of
 * @example
 * console.log(fract(12.35))
 * // Prints out 0.34999999999999964
 *
 * @return {number}
 */
function fract(v) {
  return v - Math.floor(v);
}

/**
 * Convert a path of points to an array of lines
 *
 * @param {Array} path List of sub-paths
 *
 * @return {Array<Line>}
 */
function pathToLines(path) {
  const lines = [];
  let curr = null;

  path.forEach(function(cmd) {
    if (cmd[0] == PATH_COMMAND.MOVE) {
      curr = cmd[1];
    }
    if (cmd[0] == PATH_COMMAND.LINE) {
      var pt = cmd[1];
      lines.push(new Line(curr, pt));
      curr = pt;
    }
    if (cmd[0] == PATH_COMMAND.QUADRATIC_CURVE) {
      var pts = [ curr, cmd[1], cmd[2] ];
      for (let t = 0; t < 1; t += 0.1) {
        var pt = calcQuadraticAtT(pts, t);
        lines.push(new Line(curr, pt));
        curr = pt;
      }
    }
    if (cmd[0] === PATH_COMMAND.BEZIER_CURVE) {
      var pts = [ curr, cmd[1], cmd[2], cmd[3] ];
      bezierToLines(pts, 10).forEach(pt => {
        lines.push(new Line(curr, pt));
        curr = pt;
      });
    }
  });
  return lines;
}

/**
 * Calculate Quadratic
 *
 * @param {number} p
 * @param {number} t
 *
 * @ignore
 *
 * @return {void}
 */
function calcQuadraticAtT(p, t) {
  const x =
    (1 - t) * (1 - t) * p[0].x + 2 * (1 - t) * t * p[1].x + t * t * p[2].x;
  const y =
    (1 - t) * (1 - t) * p[0].y + 2 * (1 - t) * t * p[1].y + t * t * p[2].y;
  return new Point(x, y);
}

/**
 * Calculate Bezier at T
 *
 * @param {number} p
 * @param {number} t
 *
 * @return {void}
 */
function calcBezierAtT(p, t) {
  const x =
    (1 - t) * (1 - t) * (1 - t) * p[0].x +
    3 * (1 - t) * (1 - t) * t * p[1].x +
    3 * (1 - t) * t * t * p[2].x +
    t * t * t * p[3].x;
  const y =
    (1 - t) * (1 - t) * (1 - t) * p[0].y +
    3 * (1 - t) * (1 - t) * t * p[1].y +
    3 * (1 - t) * t * t * p[2].y +
    t * t * t * p[3].y;
  return new Point(x, y);
}

function bezierToLines(curve, THRESHOLD) {
  function recurse(curve) {
    if (flatness(curve) < THRESHOLD) return [ curve[0], curve[3] ];
    const split = splitCurveAtT(curve, 0.5, false);
    return recurse(split[0]).concat(recurse(split[1]));
  }
  return recurse(curve);
}

function splitCurveAtT(p, t, debug) {
  const p1 = p[0];
  const p2 = p[1];
  const p3 = p[2];
  const p4 = p[3];

  const p12 = midpoint(p1, p2, t);
  const p23 = midpoint(p2, p3, t);
  const p34 = midpoint(p4, p3, t);

  const p123 = midpoint(p12, p23, t);
  const p234 = midpoint(p23, p34, t);
  const p1234 = {
    x: (p234.x - p123.x) * t + p123.x,
    y: (p234.y - p123.y) * t + p123.y,
  };

  return [
    [ p1, p12, p123, p1234 ],
    [ p1234, p234, p34, p4 ],
  ];
}

function flatness(curve) {
  const pointA = curve[0];
  const controlPointA = curve[1];
  const controlPointB = curve[2];
  const pointB = curve[3];
  let ux = Math.pow(3 * controlPointA.x - 2 * pointA.x - pointB.x, 2);
  let uy = Math.pow(3 * controlPointA.y - 2 * pointA.y - pointB.y, 2);
  const vx = Math.pow(3 * controlPointB.x - 2 * pointB.x - pointA.x, 2);
  const vy = Math.pow(3 * controlPointB.y - 2 * pointB.y - pointA.y, 2);
  if (ux < vx) ux = vx;
  if (uy < vy) uy = vy;
  return ux + uy;
}

function midpoint(p1, p2, t) {
  return { x: (p2.x - p1.x) * t + p1.x, y: (p2.y - p1.y) * t + p1.y };
}

/**
 * Calculate Minimum Bounds
 *
 * @param {Array} lines
 *
 * @ignore
 *
 * @return {{x: Number.MAX_VALUE, y: Number.MAX_VALUE, x2: Number.MIN_VALUE, y2: Number.MIN_VALUE}}
 */
function calcMinimumBounds(lines) {
  const bounds = {
    x: Number.MAX_VALUE,
    y: Number.MAX_VALUE,
    x2: Number.MIN_VALUE,
    y2: Number.MIN_VALUE,
  };
  function checkPoint(pt) {
    bounds.x = Math.min(bounds.x, pt.x);
    bounds.y = Math.min(bounds.y, pt.y);
    bounds.x2 = Math.max(bounds.x2, pt.x);
    bounds.y2 = Math.max(bounds.y2, pt.y);
  }
  lines.forEach(function(line) {
    checkPoint(line.start);
    checkPoint(line.end);
  });
  return bounds;
}

/**
 * Calculate Sorted Intersections
 *
 * Adopted from http://alienryderflex.com/polygon
 *
 * @see http://alienryderflex.com/polygon
 *
 * @param {Array} lines An {@link Array} of Lines
 * @param {number} y
 *
 * @ignore
 *
 * @return {Array}
 */
function calcSortedIntersections(lines, y) {
  const xlist = [];
  for (let i = 0; i < lines.length; i++) {
    const A = lines[i].start;
    const B = lines[i].end;
    if ((A.y < y && B.y >= y) || (B.y < y && A.y >= y)) {
      const xval = A.x + ((y - A.y) / (B.y - A.y)) * (B.x - A.x);
      xlist.push(xval);
    }
  }
  return xlist.sort(function(a, b) {
    return a - b;
  });
}

/**
 * Linear Interpolation
 *
 * In mathematics, linear interpolation is a method of curve fitting using linear polynomials to construct new data
 * points within the range of a discrete set of known data points.
 *
 * @param {number} a
 * @param {number} b
 * @param {number} t
 *
 * @ignore
 *
 * @see https://en.wikipedia.org/wiki/Linear_interpolation
 *
 * @return {number}
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Clamping is the process of limiting a position to an area
 *
 * @see https://en.wikipedia.org/wiki/Clamping_(graphics)
 *
 * @param {number} value The value to apply the clamp restriction to
 * @param {number} min   Lower limit
 * @param {number} max   Upper limit
 *
 * @return {number}
 */
function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
const PI_2 = Math.PI * 2;
function normalize(radians) {
  return radians - PI_2 * Math.floor(radians / PI_2);
}
