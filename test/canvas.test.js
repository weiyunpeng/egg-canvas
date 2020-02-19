'use strict';

const mock = require('egg-mock');
const assert = require('assert');
const fs = require('fs');

describe('test/canvas.test.js', () => {
  let app;

  before(() => {
    app = mock.app({
      baseDir: 'apps/canvas-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    return app
      .httpRequest()
      .get('/')
      .expect('hi, canvas')
      .expect(200);
  });

  it('canvas is empty and clear', () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(200, 200);
    assert(image.getPixelRGBA(0, 0) === 0x00000000);
  });

  it('can draw a full image', () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(200, 200);
    const context = image.getContext('2d');

    const src = ctx.service.canvas.make(50, 50);
    const c = src.getContext('2d');
    c.fillStyle = 'white';
    c.fillRect(0, 0, 50, 50);
    c.fillStyle = 'black';
    c.fillRect(25, 0, 25, 50);
    context.drawImage(src, 0, 0, 50, 50, 0, 0, 50, 50);
    assert(image.getPixelRGBA(0, 0) === 0xFFFFFFFF);
    assert(image.getPixelRGBA(25, 0) === 0x000000FF);
  });

  it('can stretch a full image', () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(200, 200);
    const context = image.getContext('2d');

    const src = ctx.service.canvas.make(50, 50);
    const c = src.getContext('2d');
    c.fillStyle = 'white';
    c.fillRect(0, 0, 50, 50);
    c.fillStyle = 'black';
    c.fillRect(25, 0, 25, 50);
    context.drawImage(src, 0, 0, 50, 50, 0, 0, 200, 200);
    assert(image.getPixelRGBA(0, 0) === 0xFFFFFFFF);
    assert(image.getPixelRGBA(25, 0) === 0xFFFFFFFF);
    assert(image.getPixelRGBA(100, 0) === 0x000000FF);
    assert(image.getPixelRGBA(199, 0) === 0x000000FF);
  });

  it('can draw a plain image', () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(200, 200);
    const context = image.getContext('2d');

    const src = ctx.service.canvas.make(50, 50);
    const c = src.getContext('2d');
    c.fillStyle = 'white';
    c.fillRect(0, 0, 50, 50);
    c.fillStyle = 'black';
    c.fillRect(25, 0, 25, 50);
    context.drawImage(src, 0, 0);
    assert(image.getPixelRGBA(0, 0) === 0xFFFFFFFF);
    assert(image.getPixelRGBA(25, 0) === 0x000000FF);
  });

  it('can draw a scaled image', () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(200, 200);
    const context = image.getContext('2d');

    const src = ctx.service.canvas.make(50, 50);
    const c = src.getContext('2d');
    c.fillStyle = 'white';
    c.fillRect(0, 0, 50, 50);
    c.fillStyle = 'black';
    c.fillRect(25, 0, 25, 50);
    context.drawImage(src, 0, 0, 200, 200);
    assert(image.getPixelRGBA(0, 0) === 0xFFFFFFFF);
    assert(image.getPixelRGBA(100, 0) === 0x000000FF);
  });

  it('is making a linear gradient', () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(20, 20);
    const c = image.getContext('2d');
    c.fillStyle = 'black';
    c.fillRect(0, 0, 200, 200);

    const grad = c.createLinearGradient(0, 0, 20, 20);
    grad.addColorStop(0, 'white');
    grad.addColorStop(1, 'blue');
    c.fillStyle = grad;
    c.fillRect(0, 0, 20, 20);

    ctx.service.canvas
      .encodePNGToStream(image, fs.createWriteStream('lgrad.png'))
      .then(() => {
        console.log('wrote out lgrad.png');
        assert(image.getPixelRGBA(0, 0) === 0xFFFFFFFF);
        assert(image.getPixelRGBA(19, 19) === 0x0C0CFFFF);
      });
  });

  it('is making a radial gradient', () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(20, 20);
    const c = image.getContext('2d');
    c.fillStyle = 'black';
    c.fillRect(0, 0, 200, 200);

    const grad = c.createRadialGradient(10, 10, 5, 10, 10, 10);
    grad.addColorStop(0, 'white');
    grad.addColorStop(1, 'green');
    c.fillStyle = grad;
    c.fillRect(0, 0, 20, 20);

    ctx.service.canvas
      .encodePNGToStream(image, fs.createWriteStream('rgrad.png'))
      .then(() => {
        console.log('wrote out rgrad.png');
        assert(image.getPixelRGBA(0, 0) === 0x00FF00FF);
        assert(image.getPixelRGBA(10, 10) === 0xFFFFFFFF);
      });
  });

  it('making a square', () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(200, 200);
    const c = image.getContext('2d');
    c.fillStyle = 'white';
    c.fillRect(0, 0, 200, 200);

    c.beginPath();
    c.moveTo(10, 10);
    c.lineTo(100, 10);
    c.lineTo(100, 100);
    c.lineTo(10, 100);
    c.lineTo(10, 10);
    c.fillStyle = 'black';
    c.fill();
    assert(image.getPixelRGBA(0, 0) === 0xFFFFFFFF);
    assert(image.getPixelRGBA(11, 11) === 0x000000FF);
    assert(image.getPixelRGBA(50, 50) === 0x000000FF);
    assert(image.getPixelRGBA(100, 100) === 0xFFFFFFFF);
  });

  it('bezier curve', () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(200, 200);
    const c = image.getContext('2d');
    c.fillStyle = 'white';
    c.fillRect(0, 0, 200, 200);
    c.fillStyle = 'white';
    c.fillRect(0, 0, 200, 200);

    c.fillStyle = 'black';
    c.beginPath();
    c.moveTo(10, 10);
    c.bezierCurveTo(50, 50, 100, 50, 10, 100);
    c.lineTo(10, 10);
    c.fill();
    ctx.service.canvas
      .encodePNGToStream(image, fs.createWriteStream('bezier1.png'))
      .then(() => {
        console.log('wrote out bezier1.png');
        assert(image.getPixelRGBA(0, 0) === 0xFFFFFFFF);
      });
  });

  it('can draw some text', async () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(200, 200);
    const context = image.getContext('2d');
    const fontPath =
            'test/fixtures/apps/canvas-test/app/public/fonts/SourceSansPro-Regular.ttf';
    const res = await ctx.service.canvas.registerFont(
      fontPath,
      'Source Sans Pro'
    );

    context.fillStyle = 'blue';
    context.font = "28px 'Source Sans Pro'";
    context.fillText('some text', 50, 50);
    ctx.service.canvas
      .encodeJPEGToStream(image, fs.createWriteStream('fill-text.png'))
      .then(() => {
        console.log('wrote out fill-text.png');
        assert(res.binary === fontPath);
      });
  });

  it('can measure text', async () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(200, 200);
    const context = image.getContext('2d');
    const fontPath =
            'test/fixtures/apps/canvas-test/app/public/fonts/SourceSansPro-Regular.ttf';
    await ctx.service.canvas.registerFont(fontPath, 'Source Sans Pro');

    context.fillStyle = 'blue';
    context.font = "48px 'Source Sans Pro'";
    const metrics = context.measureText('some text');
    ctx.service.canvas
      .encodeJPEGToStream(image, fs.createWriteStream('measure-text.png'))
      .then(() => {
        console.log('wrote out measure-text.png');
        assert(metrics.width === 197.088);
      });
  });

  function clear(context) {
    context.fillStyle = 'white';
    context.fillRect(0, 0, 200, 200);
  }
  function write(context, str, x, y, align) {
    context.font = "48pt 'Source Sans Pro'";
    context.fillStyle = 'black';
    context.textAlign = align;
    context.fillText(str, x, y);
  }

  it('can draw horizontal aligned text', async () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(200, 200);
    const context = image.getContext('2d');
    const fontPath =
            'test/fixtures/apps/canvas-test/app/public/fonts/SourceSansPro-Regular.ttf';
    await ctx.service.canvas.registerFont(fontPath, 'Source Sans Pro');

    clear(context);
    write(context, 'U', 50, 50, 'start');
    assert(image.getPixelRGBA(49, 20) === 0xFFFFFFFF);
    assert(image.getPixelRGBA(57, 20) === 0x000000FF);
    clear(context);
    write(context, 'U', 50, 50, 'end');
    // assert(image.getPixelRGBA(57, 20) == 0xFFFFFFFF);
    // assert(image.getPixelRGBA(43, 20) == 0x000000FF);
    clear(context);
    write(context, 'U', 50, 50, 'center');
    assert(image.getPixelRGBA(50, 20) === 0xFFFFFFFF);
    // assert(image.getPixelRGBA(41, 20) == 0x000000FF);
  });

  function writeV(context, str, x, y, align) {
    context.font = "48pt 'Source Sans Pro'";
    context.fillStyle = 'black';
    context.textBaseline = align;
    context.fillText(str, x, y);
  }

  it('can draw verticl aligned text', async () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(200, 200);
    const context = image.getContext('2d');
    const fontPath =
            'test/fixtures/apps/canvas-test/app/public/fonts/SourceSansPro-Regular.ttf';
    await ctx.service.canvas.registerFont(fontPath, 'Source Sans Pro');

    clear(context);
    context.fillStyle = 'red';
    context.fillRect(0, 50, 200, 1);
    context.fillStyle = 'black';
    context.fillRect(0, 50 - 47, 200, 1);
    context.fillRect(0, 50 - 47 / 2, 200, 1);
    context.fillRect(0, 50 - 13, 200, 1);
    // writeV(context,'hey',50,50,'alphabetic')
    // writeV(context,'Hello',50,50,'top')
    // writeV(context,'Hey',50,50,'middle')
    // writeV(context,'hey',50,50,'alphabetic')
    writeV(context, 'hey', 50, 50, 'bottom');
    ctx.service.canvas
      .encodePNGToStream(image, fs.createWriteStream('aligned-text.png'))
      .then(() => {
        console.log('wrote out aligned-text.png');
        // top
        // expect(image.getPixelRGBA(90,37+47)).toBe(BLACK)
        // expect(image.getPixelRGBA(90,39+47)).toBe(WHITE)
        // middle
        // expect(image.getPixelRGBA(90,37+47/2+ -13/2)).toBe(BLACK)
        // expect(image.getPixelRGBA(90,39+47/2+ -13/2)).toBe(WHITE)
        // alphabetic
        // expect(image.getPixelRGBA(90,37)).toBe(BLACK)
        // expect(image.getPixelRGBA(90,39)).toBe(WHITE)
        // bottom
        assert(image.getPixelRGBA(90, 37 - 13) === 0x000000FF);
        assert(image.getPixelRGBA(90, 40 - 13) === 0xFFFFFFFF);
      });
  });
});
