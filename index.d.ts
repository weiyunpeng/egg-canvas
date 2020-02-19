import CanvasService = require('./app/service/canvas');

declare module 'egg' {
  // extend service
  interface IService {
    canvas: CanvasService;
  }
}