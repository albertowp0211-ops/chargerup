const VENTAJAS = [
  {
    n: '01',
    titulo: 'Carga rápida de verdad',
    texto:
      'El adaptador original habla con tu iPhone por USB-C Power Delivery y acuerdan cuánta potencia admite en cada instante. Por eso llega al 50 % en unos 30 minutos. Un cargador barato suele quedarse en 5 W aunque en la caja ponga 20.',
  },
  {
    n: '02',
    titulo: 'La batería envejece más despacio',
    texto:
      'Lo que degrada una batería es el calor y la corriente mal regulada. El original ajusta la entrega y baja el ritmo al acercarse al 100 %, así que el móvil carga tibio en lugar de caliente y conserva su capacidad muchos más ciclos.',
  },
  {
    n: '03',
    titulo: 'Seguridad eléctrica',
    texto:
      'Las réplicas recortan justo por donde no se ve: aislamiento entre la red y la salida USB, filtrado y protección contra picos. Es la diferencia entre un accesorio que falla apagándose y uno que falla llevándose por delante la placa del móvil.',
  },
  {
    n: '04',
    titulo: 'Sin avisos ni cortes',
    texto:
      'Nada de "puede que este accesorio no sea compatible", ni cargas que se interrumpen solas, ni cables que dejan de dar datos a los dos meses. Funciona con cada actualización de iOS porque es la pieza que Apple diseñó para eso.',
  },
];

const COMPARATIVA = [
  ['Potencia que llega de verdad', '20 W estables', 'A menudo 5–10 W reales'],
  ['Negociación con el iPhone', 'USB-C Power Delivery', 'Entrega fija, sin diálogo'],
  ['Temperatura durante la carga', 'Tibio', 'Se calienta y se ralentiza'],
  ['Protección contra picos', 'Sí', 'Recortada o inexistente'],
  ['Avisos de accesorio en iOS', 'Ninguno', 'Frecuentes en cables no certificados'],
  ['Efecto en la vida de la batería', 'Diseñado para cuidarla', 'Acelera la degradación'],
];

export default function WhyOriginal() {
  return (
    <section className="porque container" id="por-que">
      <div className="porque-head">
        <span className="eyebrow">Por qué un cargador original</span>
        <h2>
          Cargar barato sale caro <em>a la batería</em>
        </h2>
        <p>
          Un iPhone cuesta lo que cuesta. Ahorrar seis euros en el accesorio que le mete
          corriente todos los días de su vida es, probablemente, el peor ahorro posible.
        </p>
      </div>

      <div className="porque-grid">
        {VENTAJAS.map((v) => (
          <article className="ventaja" key={v.n}>
            <span className="ventaja-n">{v.n}</span>
            <h3>{v.titulo}</h3>
            <p>{v.texto}</p>
          </article>
        ))}
      </div>

      <div className="tabla-wrap">
        <table className="comparativa">
          <caption>Original de Apple frente a cargador genérico</caption>
          <thead>
            <tr>
              <th scope="col">&nbsp;</th>
              <th scope="col" className="col-ok">
                Original Apple
              </th>
              <th scope="col">Genérico</th>
            </tr>
          </thead>
          <tbody>
            {COMPARATIVA.map(([concepto, original, generico]) => (
              <tr key={concepto}>
                <th scope="row">{concepto}</th>
                <td className="col-ok">{original}</td>
                <td className="col-no">{generico}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
