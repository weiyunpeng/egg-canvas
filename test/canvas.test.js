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
    return app.httpRequest().get('/').expect('hi, canvas')
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
    assert(image.getPixelRGBA(0, 0) === 0xffffffff);
    assert(image.getPixelRGBA(25, 0) === 0x000000ff);
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
    assert(image.getPixelRGBA(0, 0) === 0xffffffff);
    assert(image.getPixelRGBA(25, 0) === 0xffffffff);
    assert(image.getPixelRGBA(100, 0) === 0x000000ff);
    assert(image.getPixelRGBA(199, 0) === 0x000000ff);
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
    assert(image.getPixelRGBA(0, 0) === 0xffffffff);
    assert(image.getPixelRGBA(25, 0) === 0x000000ff);
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
    assert(image.getPixelRGBA(0, 0) === 0xffffffff);
    assert(image.getPixelRGBA(100, 0) === 0x000000ff);
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
        assert(image.getPixelRGBA(0, 0) === 0xffffffff);
        assert(image.getPixelRGBA(19, 19) === 0x0c0cffff);
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
        assert(image.getPixelRGBA(0, 0) === 0x00ff00ff);
        assert(image.getPixelRGBA(10, 10) === 0xffffffff);
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
    assert(image.getPixelRGBA(0, 0) === 0xffffffff);
    assert(image.getPixelRGBA(11, 11) === 0x000000ff);
    assert(image.getPixelRGBA(50, 50) === 0x000000ff);
    assert(image.getPixelRGBA(100, 100) === 0xffffffff);
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
        assert(image.getPixelRGBA(0, 0) === 0xffffffff);
      });
  });

  it('can draw some fill text', async () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(200, 200);
    const context = image.getContext('2d');
    const fontPath = 'test/fixtures/apps/canvas-test/app/public/fonts/2.ttf';
    const res = await ctx.service.canvas.registerFont(
      fontPath,
      'Source Sans Pro'
    );

    context.fillStyle = 'white';
    context.fillRect(0, 0, 200, 200);
    context.fillStyle = 'red';
    context.fillRect(0, 50, 200, 1);
    context.fillStyle = 'black';
    context.fillRect(0, 50 - 47, 200, 1);
    context.fillRect(0, 50 - 47 / 2, 200, 1);
    context.fillRect(0, 50 - 13, 200, 1);
    context.font = "23px 'Source Sans Pro'";
    context.fillStyle = 'black';
    context.textBaseline = 'bottom';
    context.fillText('中国chinese', 50, 50);
    ctx.service.canvas
      .encodePNGToStream(image, fs.createWriteStream('fill-text.png'))
      .then(() => {
        console.log('wrote out fill-text.png');
        assert(res.binary === fontPath);
      });
  });

  it('can draw some stroke text', async () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(800, 800);
    const context = image.getContext('2d');
    const fontPath = 'test/fixtures/apps/canvas-test/app/public/fonts/1.otf';
    const res = await ctx.service.canvas.registerFont(fontPath, 'no font');

    context.strokeStyle = '#ffffff';
    context.font = "50px 'no font'";
    context.imageSmoothingEnabled = true;
    context.strokeText('中国chinese', 200, 300);
    ctx.service.canvas
      .encodePNGToStream(image, fs.createWriteStream('stroke-text.png'))
      .then(() => {
        console.log('wrote out stroke-text.png');
        assert(res.binary === fontPath);
      });
  });

  it('can draw some text of otf', async () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(800, 800);
    const context = image.getContext('2d');
    const fontPath = 'test/fixtures/apps/canvas-test/app/public/fonts/1.otf';
    const res = await ctx.service.canvas.registerFont(fontPath, 'no font');

    context.fillStyle = '#ffffff';
    context.imageSmoothingEnabled = true;
    context.font = "50px 'no font'";
    context.fillText('中国chinese', 200, 300);
    ctx.service.canvas
      .encodePNGToStream(image, fs.createWriteStream('otf-text.png'))
      .then(() => {
        console.log('wrote out otf-text.png');
        assert(res.binary === fontPath);
      });
  });

  it('can measure text', async () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(200, 200);
    const context = image.getContext('2d');
    const fontPath = 'test/fixtures/apps/canvas-test/app/public/fonts/2.ttf';
    await ctx.service.canvas.registerFont(
      fontPath,
      'Source Sans Pro'
    );
    context.font = "23px 'Source Sans Pro'";
    const metrics = context.measureText('some text');
    assert(metrics === 197.088);
  });

  it('draw fillTextVertical text', async () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(200, 200);
    const context = image.getContext('2d');
    const fontPath = 'test/fixtures/apps/canvas-test/app/public/fonts/1.otf';
    await ctx.service.canvas.registerFont(fontPath, 'mo Pro');

    context.font = "30pt 'mo Pro'";
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.fillTextVertical('hello:我是123', 80, 20);
    ctx.service.canvas
      .encodePNGToStream(image, fs.createWriteStream('vertical-text.png'))
      .then(() => {
        console.log('wrote out vertical-text.png');
        // assert(image.getPixelRGBA(49, 20) === 0xffffffff);
        // assert(image.getPixelRGBA(57, 20) === 0x000000ff);
      });
  });

  it('draw strokeTextVertical text', async () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(200, 200);
    const context = image.getContext('2d');
    const fontPath = 'test/fixtures/apps/canvas-test/app/public/fonts/1.otf';
    await ctx.service.canvas.registerFont(fontPath, 'mo Pro');

    context.font = "30pt 'mo Pro'";
    context.strokeStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.strokeTextVertical('hello:我是123', 80, 20);
    ctx.service.canvas
      .encodePNGToStream(
        image,
        fs.createWriteStream('stroke-vertical-text.png')
      )
      .then(() => {
        console.log('wrote out stroke-vertical-text.png');
        // assert(image.getPixelRGBA(49, 20) === 0xffffffff);
        // assert(image.getPixelRGBA(57, 20) === 0x000000ff);
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
    assert(image.getPixelRGBA(49, 20) === 0xffffffff);
    assert(image.getPixelRGBA(57, 20) === 0x000000ff);
    clear(context);
    write(context, 'U', 50, 50, 'end');
    // assert(image.getPixelRGBA(57, 20) == 0xFFFFFFFF);
    // assert(image.getPixelRGBA(43, 20) == 0x000000FF);
    clear(context);
    write(context, 'U', 50, 50, 'center');
    assert(image.getPixelRGBA(50, 20) === 0xffffffff);
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
    writeV(context, 'hey', 50, 50, 'alphabetic');
    // writeV(context, 'hey', 50, 50, 'bottom');
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
        assert(image.getPixelRGBA(90, 37) === 0x000000ff);
        assert(image.getPixelRGBA(90, 39) === 0xffffffff);
      });
  });

  it('represents a set of x and y co-ordinates in 2D space', () => {
    const Point = require('../app/utils/Point');
    const point = new Point(20, 60);

    assert(point.x === 20);
    assert(point.y === 60);
  });

  it('is the distance between two points', () => {
    const Point = require('../app/utils/Point');
    const Line = require('../app/utils/Line');
    const start = new Point(6, 8);
    const end = new Point(0, 0);

    const line = new Line(start, end);

    assert(line.getLength() === 10);
  });

  it('aa polygon', () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(200, 200);
    const context = image.getContext('2d');
    context.strokeStyle = '#ffffff';
    context.beginPath();
    context.moveTo(10, 10);
    context.lineTo(180, 30);
    context.lineTo(50, 90);
    context.lineTo(10, 10);
    context.stroke();
    ctx.service.canvas
      .encodePNGToStream(image, fs.createWriteStream('aa-polygon.png'))
      .then(() => {
        console.log('wrote out aa-polygon.png');
        // assert(metrics.width === 197.088);
      });
  });

  it('aa polygon fill', () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(200, 200);
    const context = image.getContext('2d');
    context.fillStyle = '#ffffff';
    context.imageSmoothingEnabled = true;
    context.beginPath();
    context.moveTo(10, 10);
    context.lineTo(180, 30);
    context.lineTo(50, 90);
    context.lineTo(10, 10);
    context.fill();
    ctx.service.canvas
      .encodePNGToStream(image, fs.createWriteStream('aa-polygon-fill.png'))
      .then(() => {
        console.log('wrote out aa-polygon-fill.png');
        // assert(metrics.width === 197.088);
      });
  });

  it('aa polygon fill no smoothing', () => {
    const ctx = app.mockContext();
    const image = ctx.service.canvas.make(200, 200);
    const context = image.getContext('2d');
    context.fillStyle = '#ffffff';
    context.imageSmoothingEnabled = false;
    context.beginPath();
    context.moveTo(10, 10);
    context.lineTo(180, 30);
    context.lineTo(50, 90);
    context.lineTo(10, 10);
    context.fill();
    ctx.service.canvas
      .encodePNGToStream(
        image,
        fs.createWriteStream('aa-polygon-fill-no-smoothing.png')
      )
      .then(() => {
        console.log('wrote out aa-polygon-fill-no-smoothing.png');
        // assert(metrics.width === 197.088);
      });
  });
});
