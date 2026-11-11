// Controladores: reciben la petición ya validada y usan el cliente de IA.
export function crearControladorIA({ clienteIA, consumo }) {
  return {
    async preguntar(req, res, next) {
      try {
        const resultado = await clienteIA.preguntar(req.dto);
        consumo.registrarExito(resultado.tokens);
        res.status(200).json(resultado);
      } catch (error) {
        consumo.registrarFallo();
        next(error);
      }
    },
    verConsumo(req, res) {
      res.status(200).json({ ...consumo.resumen(), modelo: clienteIA.modelo, simulado: clienteIA.simulado });
    },
  };
}
