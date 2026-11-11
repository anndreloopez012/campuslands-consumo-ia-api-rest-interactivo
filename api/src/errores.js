// Error con código HTTP para responder al cliente con un mensaje claro.
export class ErrorApi extends Error {
  constructor(status, mensaje, detalle) {
    super(mensaje);
    this.status = status;
    this.detalle = detalle;
  }
}
