// Contenido de las páginas legales de la tienda.
// Los tokens {{MARCA}}, {{NIF}}… se sustituyen por los datos reales (config.js)
// al renderizar (rellenarTokens). ⚠️ Plantillas orientativas, NO asesoramiento
// jurídico: revísalas con un profesional y completa los datos de la empresa
// en client/src/config.js antes de vender.

export const PAGINAS = {
  "aviso-legal": {
    "titulo": "Aviso Legal",
    "secciones": [
      {
        "h": "Identificación del titular (art. 10 LSSI-CE)",
        "p": [
          "En cumplimiento del deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se ponen a disposición de los usuarios los siguientes datos del titular de este sitio web:",
          "Titular: {{RAZON_SOCIAL}}.",
          "NIF/CIF: {{NIF}}.",
          "Domicilio: {{DOMICILIO}}.",
          "Correo electrónico de contacto: {{EMAIL}}.",
          "Teléfono: {{TELEFONO}}.",
          "Sitio web: {{DOMINIO}}.",
          "En caso de estar inscrita en el Registro Mercantil u otro registro público, se harán constar aquí los datos de inscripción correspondientes.",
          "{{MARCA}} es la marca comercial bajo la que {{RAZON_SOCIAL}} desarrolla su actividad de venta en línea."
        ]
      },
      {
        "h": "Objeto",
        "p": [
          "A través de este sitio web, {{MARCA}} ofrece a los consumidores la venta de cargadores y accesorios para teléfonos móviles. El presente Aviso Legal regula el acceso y uso del sitio web {{DOMINIO}}. La navegación por el sitio atribuye la condición de usuario e implica la aceptación de las condiciones aquí recogidas.",
          "Los productos se comercializan bajo un modelo de dropshipping: se envían desde un proveedor internacional situado fuera de la Unión Europea. {{MARCA}} es, en todo caso, el vendedor y responsable frente al consumidor."
        ]
      },
      {
        "h": "Precios e información comercial",
        "p": [
          "Todos los precios mostrados en la web incluyen el IVA aplicable. El precio indicado es el precio final del producto. Los gastos de envío se informan de forma separada antes de finalizar la compra: el envío es gratuito en pedidos iguales o superiores a 25 € y de 4,99 € en pedidos inferiores.",
          "Las comunicaciones comerciales que en su caso remita {{MARCA}} serán claramente identificables como tales. {{MARCA}} no envía comunicaciones comerciales no solicitadas; los correos de confirmación de pedido son comunicaciones de servicio necesarias para la ejecución del contrato."
        ]
      },
      {
        "h": "Propiedad intelectual e industrial",
        "p": [
          "Los contenidos de este sitio web (textos, diseño, logotipos, marca {{MARCA}}, estructura y código) son titularidad de {{RAZON_SOCIAL}} o de terceros que han autorizado su uso, y están protegidos por la normativa de propiedad intelectual e industrial.",
          "Queda prohibida su reproducción, distribución, comunicación pública o transformación sin autorización expresa del titular. Las imágenes y denominaciones de productos de fabricantes se utilizan a título identificativo y pertenecen a sus respectivos titulares."
        ]
      },
      {
        "h": "Responsabilidad",
        "p": [
          "{{MARCA}} no se hace responsable de los daños derivados de un uso indebido del sitio web ni de interrupciones, virus o fallos técnicos ajenos a su control, si bien se compromete a emplear medios razonables para garantizar la disponibilidad y seguridad del sitio.",
          "El sitio puede contener enlaces a páginas de terceros (por ejemplo, la pasarela de pago). {{MARCA}} no se responsabiliza de los contenidos ni de las políticas de dichos sitios, que se rigen por sus propias condiciones."
        ]
      },
      {
        "h": "Legislación aplicable y fuero",
        "p": [
          "Las presentes condiciones se rigen por la legislación española. Para la resolución de cualquier controversia, y cuando el usuario tenga la condición de consumidor, será competente el juzgado o tribunal del domicilio del consumidor, de acuerdo con la normativa de protección de los consumidores y usuarios.",
          "No se someterá al consumidor a fueros distintos del de su propio domicilio."
        ]
      },
      {
        "h": "Resolución de litigios",
        "p": [
          "La plataforma europea de resolución de litigios en línea (ODR) de la Comisión Europea dejó de estar operativa el 20 de julio de 2025, tras la derogación del Reglamento (UE) nº 524/2013 por el Reglamento (UE) 2024/3228. Por ello ya no existe obligación de enlazarla ni es posible presentar reclamaciones a través de ella.",
          "Puedes dirigir cualquier reclamación a {{EMAIL}}, indicando tu número de pedido. Encontrarás información detallada sobre las vías de reclamación y resolución alternativa de litigios en las Condiciones Generales de Contratación."
        ]
      }
    ]
  },
  "privacidad": {
    "titulo": "Política de Privacidad",
    "secciones": [
      {
        "h": "Información resumida (primera capa)",
        "p": [
          "Responsable: {{RAZON_SOCIAL}} ({{NIF}}).",
          "Finalidad: gestionar tu pedido, el pago, el envío, la facturación y la atención al cliente, y cumplir nuestras obligaciones legales.",
          "Legitimación: ejecución del contrato de compraventa y cumplimiento de obligaciones legales.",
          "Destinatarios: proveedores que nos prestan servicios (pago, email, alojamiento y aviso de venta), incluidas transferencias a EE. UU. con garantías adecuadas. No vendemos tus datos.",
          "Derechos: acceso, rectificación, supresión, oposición, limitación y portabilidad, escribiendo a {{EMAIL}}, y reclamación ante la AEPD.",
          "A continuación se detalla cada punto (segunda capa)."
        ]
      },
      {
        "h": "Responsable del tratamiento",
        "p": [
          "El responsable del tratamiento de tus datos es {{RAZON_SOCIAL}}, con NIF {{NIF}} y domicilio en {{DOMICILIO}}.",
          "Para cualquier cuestión relativa a tus datos personales puedes contactar en {{EMAIL}} o en el teléfono {{TELEFONO}}."
        ]
      },
      {
        "h": "Datos que tratamos",
        "p": [
          "Datos identificativos y de contacto: nombre y apellidos, correo electrónico y, si lo facilitas, teléfono.",
          "Datos de envío: dirección postal, ciudad y código postal.",
          "Datos de la compra: productos adquiridos, importe y número de pedido.",
          "Datos de pago: los datos de tu tarjeta los trata directamente Stripe en su entorno seguro. {{MARCA}} no ve, no recibe ni almacena el número completo de tu tarjeta.",
          "No solicitamos ni tratamos categorías especiales de datos. No es necesario crear una cuenta ni registrarse para comprar."
        ]
      },
      {
        "h": "Finalidades y bases jurídicas",
        "p": [
          "Gestionar y tramitar tu pedido, el envío y la entrega. Base jurídica: ejecución del contrato del que eres parte (art. 6.1.b RGPD).",
          "Gestionar el cobro a través de la pasarela de pago. Base jurídica: ejecución del contrato.",
          "Enviarte el correo de confirmación del pedido y comunicaciones de servicio (seguimiento, incidencias). Base jurídica: ejecución del contrato.",
          "Emitir facturas y cumplir obligaciones fiscales, contables y de consumo. Base jurídica: cumplimiento de obligaciones legales (art. 6.1.c RGPD).",
          "Atender tus consultas, reclamaciones y solicitudes de desistimiento. Base jurídica: ejecución del contrato e interés legítimo en atenderte.",
          "Solo te enviaremos comunicaciones comerciales o newsletter si nos das tu consentimiento previo, que podrás retirar en cualquier momento."
        ]
      },
      {
        "h": "Destinatarios y encargados del tratamiento",
        "p": [
          "Para prestarte el servicio compartimos los datos imprescindibles con los siguientes proveedores, que actúan como encargados del tratamiento por cuenta de {{MARCA}} y con los que se han suscrito los contratos exigidos por el art. 28 RGPD:",
          "Stripe (Stripe Payments Europe, Ltd., Irlanda): procesamiento del pago con tarjeta y prevención del fraude.",
          "Brevo (Sendinblue) o el proveedor de correo SMTP utilizado: envío del correo de confirmación del pedido y avisos de servicio.",
          "Render (Render Services, Inc., EE. UU.): alojamiento del servidor y de la base de datos PostgreSQL donde se guarda tu pedido (nombre, email, teléfono, dirección, ciudad y CP).",
          "Vercel (Vercel Inc., EE. UU.): alojamiento de la web y analítica de audiencia sin cookies y sin datos personales.",
          "Telegram: al confirmarse una venta, se envía a un canal privado del responsable un aviso interno con tu nombre, ciudad y código postal, con la única finalidad de notificar la venta al titular del negocio.",
          "También podrán acceder a los datos, cuando sea legalmente exigible, las Administraciones públicas y organismos con competencia (Agencia Tributaria, fuerzas y cuerpos de seguridad, juzgados)."
        ]
      },
      {
        "h": "Transferencias internacionales",
        "p": [
          "El alojamiento en Render y Vercel y el aviso de venta a través de Telegram implican transferencias de datos a Estados Unidos u otros países fuera del Espacio Económico Europeo.",
          "Estas transferencias se amparan en las garantías adecuadas previstas en el RGPD: la adhesión de los proveedores al marco EU-US Data Privacy Framework y/o la firma de Cláusulas Contractuales Tipo aprobadas por la Comisión Europea, junto con las medidas de seguridad complementarias correspondientes.",
          "Puedes solicitar más información sobre estas garantías escribiendo a {{EMAIL}}."
        ]
      },
      {
        "h": "Plazos de conservación",
        "p": [
          "Conservaremos tus datos mientras dure la relación contractual y, posteriormente, durante los plazos legalmente exigidos para atender posibles responsabilidades: obligaciones fiscales y mercantiles (habitualmente hasta 4-6 años) y el plazo de la garantía legal y de posibles reclamaciones de consumo.",
          "Transcurridos dichos plazos, los datos se suprimirán o se anonimizarán."
        ]
      },
      {
        "h": "Tus derechos",
        "p": [
          "Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad, así como retirar el consentimiento prestado, escribiendo a {{EMAIL}} e indicando el derecho que deseas ejercer. Podremos solicitarte que acredites tu identidad.",
          "Si consideras que el tratamiento no se ajusta a la normativa, tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD), C/ Jorge Juan 6, 28001 Madrid, www.aepd.es."
        ]
      },
      {
        "h": "Seguridad y cookies",
        "p": [
          "Aplicamos medidas técnicas y organizativas apropiadas para proteger tus datos, incluido el cifrado de las comunicaciones (HTTPS) y el control de acceso al panel de administración.",
          "Este sitio no utiliza cookies de seguimiento o publicidad. La información sobre el almacenamiento local (carrito y datos de envío) y la analítica sin cookies se detalla en la Política de Cookies."
        ]
      }
    ]
  },
  "cookies": {
    "titulo": "Política de Cookies y Almacenamiento Local",
    "secciones": [
      {
        "h": "¿Usamos cookies que requieran tu consentimiento?",
        "p": [
          "No. En {{DOMINIO}} no utilizamos cookies de publicidad, de seguimiento ni de perfilado, y no instalamos cookies que requieran tu consentimiento. Por eso no verás un banner de cookies.",
          "Sí empleamos algunas tecnologías estrictamente necesarias para el funcionamiento de la tienda, exentas de consentimiento conforme al artículo 22.2 de la LSSI y a la Guía de cookies de la AEPD (mayo de 2024). Te informamos de ellas a continuación en cumplimiento del deber de transparencia."
        ]
      },
      {
        "h": "Almacenamiento local (localStorage): carrito y datos de envío",
        "p": [
          "Guardamos en tu propio navegador los productos de tu carrito y, si los rellenas, tus datos de envío, para que no se pierdan al navegar entre páginas.",
          "Esta información permanece en tu dispositivo, no se envía a terceros con fines de seguimiento y puedes borrarla vaciando los datos del sitio en tu navegador. Finalidad: técnica/funcional. Base: art. 22.2 LSSI (servicio expresamente solicitado por el usuario)."
        ]
      },
      {
        "h": "Service worker (aplicación web progresiva, PWA)",
        "p": [
          "Almacenamos archivos de la web en la caché de tu dispositivo para que la tienda cargue más rápido y pueda funcionar sin conexión. Finalidad: técnica, estrictamente necesaria. Exenta de consentimiento."
        ]
      },
      {
        "h": "Medición de audiencia: Vercel Web Analytics",
        "p": [
          "Usamos una herramienta de analítica sin cookies que no guarda ningún identificador en tu dispositivo ni permite seguirte entre webs. Genera estadísticas agregadas de visitas mediante un valor técnico anónimo que se descarta a las 24 horas. No tratamos datos personales con esta herramienta. Proveedor: Vercel Inc. (EE. UU.)."
        ]
      },
      {
        "h": "Pago con tarjeta: Stripe",
        "p": [
          "Al finalizar la compra te redirigimos a la pasarela segura de Stripe (Stripe Payments Europe, Ltd., Irlanda). Stripe instala sus propias cookies en su dominio, necesarias para procesar el pago y prevenir el fraude; su uso se rige por la política de cookies de Stripe. {{MARCA}} no instala esas cookies ni accede a ellas, ya que se establecen fuera de nuestro sitio."
        ]
      },
      {
        "h": "Conclusión: no se requiere banner de consentimiento",
        "p": [
          "No utilizamos Google Analytics, píxeles de redes sociales, cookies publicitarias ni de remarketing. Al tratarse únicamente de almacenamiento funcional exento y analítica sin cookies, no es necesario un banner de consentimiento.",
          "Si en el futuro incorporáramos alguna tecnología que requiera consentimiento, te lo solicitaríamos previamente mediante un banner con opciones igual de visibles de 'Aceptar' y 'Rechazar'.",
          "Responsable: {{RAZON_SOCIAL}} ({{NIF}}), {{DOMICILIO}}. Contacto: {{EMAIL}} / {{TELEFONO}}. Última actualización: julio de 2026."
        ]
      }
    ]
  },
  "condiciones": {
    "titulo": "Condiciones Generales de Contratación",
    "secciones": [
      {
        "h": "Identificación y objeto",
        "p": [
          "Las presentes Condiciones Generales de Contratación regulan la compraventa de productos a través de la tienda en línea {{DOMINIO}}, titularidad de {{RAZON_SOCIAL}}, con NIF {{NIF}}, domicilio en {{DOMICILIO}}, correo {{EMAIL}} y teléfono {{TELEFONO}}.",
          "Al realizar un pedido, el usuario declara ser mayor de edad y tener capacidad legal para contratar, y acepta expresamente estas condiciones, el Aviso Legal y la Política de Privacidad.",
          "{{MARCA}} vende cargadores y accesorios para móvil que se envían desde un proveedor internacional situado fuera de la Unión Europea (modelo dropshipping). {{MARCA}} es el vendedor y único responsable frente al consumidor."
        ]
      },
      {
        "h": "Proceso de compra",
        "p": [
          "1. Selecciona los productos y añádelos al carrito.",
          "2. Revisa el carrito, donde verás el precio de cada producto con IVA incluido.",
          "3. Introduce los datos de envío y contacto.",
          "4. Antes de pagar, se te mostrará un resumen con el precio total con IVA, los gastos de envío y el plazo estimado de entrega.",
          "5. Marca la casilla de aceptación de estas condiciones y de la Política de Privacidad.",
          "6. Pulsa el botón de pedido con obligación de pago y realiza el pago con tarjeta.",
          "7. Recibirás un correo de confirmación que constituye el justificante del contrato en soporte duradero."
        ]
      },
      {
        "h": "Precios e impuestos",
        "p": [
          "Todos los precios se muestran en euros e incluyen el IVA aplicable. El precio mostrado es el precio final del producto.",
          "Al tratarse de envíos gestionados por {{MARCA}} bajo el régimen de importación aplicable, no tendrás que abonar IVA de importación, aranceles ni gastos de gestión adicionales en el momento de la entrega. Si, excepcionalmente, un envío pudiera generar cargos en aduana, te informaríamos antes de completar la compra.",
          "{{MARCA}} se reserva el derecho de modificar los precios en cualquier momento; se aplicará el precio vigente en el momento de realizar el pedido."
        ]
      },
      {
        "h": "Gastos y plazos de envío",
        "p": [
          "Los gastos de envío son gratuitos en pedidos iguales o superiores a 30 € y de 4,99 € en pedidos inferiores.",
          "Plazo de entrega estimado: 24/48 horas desde la confirmación del pedido, para pedidos realizados antes de las 14:00 (hora peninsular española); los realizados después de esa hora se envían el siguiente día laborable. Recibirás la información de seguimiento por correo electrónico cuando esté disponible.",
          "De acuerdo con el artículo 66 bis del TRLGDCU, nos comprometemos a entregar en un plazo máximo de 30 días naturales. Si no fuera posible, podrás concedernos un plazo adicional y, de no cumplirse, resolver el contrato con derecho al reembolso íntegro."
        ]
      },
      {
        "h": "Medios de pago",
        "p": [
          "El único medio de pago admitido es la tarjeta bancaria, a través de la pasarela segura de Stripe (Stripe Payments Europe, Ltd.). Al pulsar el botón de pago se te redirige al entorno seguro de Stripe.",
          "{{MARCA}} no almacena ni tiene acceso a los datos completos de tu tarjeta."
        ]
      },
      {
        "h": "Formación del contrato y confirmación",
        "p": [
          "El contrato se perfecciona cuando {{MARCA}} confirma el pedido mediante el correo electrónico de confirmación, que se envía en soporte duradero e incluye el detalle del pedido, la información contractual y el modelo de formulario de desistimiento.",
          "El botón que cierra la compra se identifica de forma inequívoca como pedido con obligación de pago."
        ]
      },
      {
        "h": "Derecho de desistimiento",
        "p": [
          "Si eres consumidor, dispones de 14 días naturales para desistir de la compra sin justificación, con las condiciones y efectos detallados en la Política de Desistimiento y Devoluciones."
        ]
      },
      {
        "h": "Garantía legal de conformidad (3 años)",
        "p": [
          "Todos los productos cuentan con la garantía legal de conformidad de 3 años desde la entrega, conforme al TRLGDCU (reformado por el RDL 7/2021). Durante los 2 primeros años se presume que la falta de conformidad ya existía en el momento de la entrega.",
          "Si el producto no es conforme, podrás optar entre su reparación o sustitución y, cuando proceda, la rebaja del precio o la resolución del contrato. Para ejercer la garantía, contacta en {{EMAIL}} indicando tu número de pedido. {{MARCA}} responde de la garantía con independencia de que el producto proceda de un proveedor internacional."
        ]
      },
      {
        "h": "Atención al cliente",
        "p": [
          "Puedes contactar con nuestro servicio de atención al cliente en {{EMAIL}} o en el teléfono {{TELEFONO}}, que no es una línea de tarificación especial. Atenderemos tus consultas y reclamaciones en el menor plazo posible."
        ]
      },
      {
        "h": "Reclamaciones y resolución alternativa de litigios",
        "p": [
          "Puedes dirigir cualquier reclamación a {{EMAIL}}, indicando tu número de pedido; te responderemos lo antes posible. {{RAZON_SOCIAL}} dispone de hojas oficiales de reclamaciones a disposición de los consumidores, que puedes solicitar por correo electrónico en {{EMAIL}}.",
          "La plataforma europea de resolución de litigios en línea (ODR) dejó de estar operativa el 20 de julio de 2025, tras la derogación del Reglamento (UE) nº 524/2013 por el Reglamento (UE) 2024/3228. Por ello ya no existe obligación de enlazarla ni es posible presentar reclamaciones a través de ella.",
          "Si no quedas conforme con nuestra respuesta, puedes acudir a mecanismos de resolución alternativa de litigios en materia de consumo. {{MARCA}} no está adherida al Sistema Arbitral de Consumo; no obstante, puedes dirigirte a la Junta Arbitral de Consumo de tu comunidad autónoma (el sometimiento a arbitraje requiere la aceptación de ambas partes), a los servicios de consumo autonómicos y municipales (OMIC) de tu localidad y, en compras transfronterizas en la UE, al Centro Europeo del Consumidor en España (cec.consumo.gob.es)."
        ]
      },
      {
        "h": "Legislación aplicable",
        "p": [
          "Estas condiciones se rigen por la legislación española. En caso de conflicto y siendo el usuario consumidor, será competente el juzgado de su domicilio."
        ]
      }
    ]
  },
  "desistimiento": {
    "titulo": "Derecho de Desistimiento y Devoluciones",
    "secciones": [
      {
        "h": "Derecho legal de desistimiento (14 días)",
        "p": [
          "Si eres consumidor, tienes derecho a desistir de tu compra en un plazo de 14 días naturales sin necesidad de justificación.",
          "El plazo de desistimiento expira a los 14 días naturales del día en que tú, o un tercero por ti indicado distinto del transportista, adquiristeis la posesión material de los productos. En pedidos con varios productos entregados por separado, el plazo cuenta desde la recepción del último producto.",
          "Este plazo empieza a contar cuando recibes el pedido, no cuando lo realizas ni cuando lo pagas."
        ]
      },
      {
        "h": "Cómo ejercer el desistimiento",
        "p": [
          "Para ejercer el derecho de desistimiento debes notificárnoslo mediante una declaración inequívoca (por ejemplo, una carta enviada por correo postal o un correo electrónico a {{EMAIL}}, indicando tu número de pedido).",
          "Puedes utilizar el modelo de formulario de desistimiento que figura más abajo, aunque su uso no es obligatorio. Para cumplir el plazo, basta con que la comunicación relativa al ejercicio de este derecho sea enviada antes de que venza el plazo de 14 días.",
          "Cuando dispongamos de la función de desistimiento en línea, también podrás ejercerlo desde la propia web y recibirás un acuse de recibo con la fecha y hora de tu solicitud."
        ]
      },
      {
        "h": "Consecuencias del desistimiento y reembolso",
        "p": [
          "En caso de desistimiento, te devolveremos todos los pagos recibidos, incluidos los gastos de entrega (con la excepción de los gastos adicionales resultantes de la elección por tu parte de una modalidad de entrega diferente a la modalidad menos costosa de entrega ordinaria que ofrezcamos), sin ninguna demora indebida y, en todo caso, a más tardar 14 días naturales a partir de la fecha en la que se nos informe de tu decisión de desistir.",
          "Procederemos a efectuar dicho reembolso utilizando el mismo medio de pago empleado por ti para la transacción inicial (tu tarjeta, a través de Stripe); no incurrirás en ningún gasto como consecuencia del reembolso.",
          "Podremos retener el reembolso hasta haber recibido los productos, o hasta que hayas presentado una prueba de su devolución, según qué condición se cumpla primero."
        ]
      },
      {
        "h": "Devolución de los productos y coste",
        "p": [
          "Deberás devolvernos o entregarnos los productos sin ninguna demora indebida y, en cualquier caso, a más tardar en el plazo de 14 días naturales a partir de la fecha en que nos comuniques tu decisión de desistimiento. Se considerará cumplido el plazo si efectúas la devolución de los productos antes de que concluya dicho plazo.",
          "Deberás asumir el coste directo de devolución de los productos. Ten en cuenta que, al proceder de un proveedor internacional, ese coste puede ser elevado; te indicaremos la dirección de devolución al tramitar tu solicitud. Antes de enviar nada, contacta con nosotros en {{EMAIL}} para confirmar el procedimiento.",
          "Solo serás responsable de la disminución de valor de los productos resultante de una manipulación distinta a la necesaria para establecer su naturaleza, características y funcionamiento."
        ]
      },
      {
        "h": "Excepciones al derecho de desistimiento",
        "p": [
          "Con carácter general, el derecho de desistimiento se aplica a todos los productos de nuestra tienda.",
          "No obstante, conforme al artículo 103 del TRLGDCU, no será aplicable a los productos precintados que no sean aptos para ser devueltos por razones de protección de la salud o de higiene y que hayan sido desprecintados tras la entrega (por ejemplo, auriculares intraauriculares), ni a los productos confeccionados conforme a tus especificaciones o claramente personalizados."
        ]
      },
      {
        "h": "Modelo de formulario de desistimiento (Anexo B)",
        "p": [
          "(sólo debe cumplimentar y enviar el presente formulario si desea desistir del contrato)",
          "A la atención de {{RAZON_SOCIAL}} ({{MARCA}}), {{DOMICILIO}}, correo electrónico {{EMAIL}}:",
          "Por la presente le comunico/comunicamos (*) que desisto de mi/desistimos de nuestro (*) contrato de venta del siguiente bien/prestación del siguiente servicio (*):",
          "— Pedido el/recibido el (*): ____________________",
          "— Número de pedido: ____________________",
          "— Nombre del consumidor y usuario o de los consumidores y usuarios: ____________________",
          "— Domicilio del consumidor y usuario o de los consumidores y usuarios: ____________________",
          "— Firma del consumidor y usuario o de los consumidores y usuarios (solo si el presente formulario se presenta en papel): ____________________",
          "— Fecha: ____________________",
          "(*) Táchese lo que no proceda."
        ]
      }
    ]
  },
  "envios-devoluciones": {
    "titulo": "Envíos y Devoluciones",
    "secciones": [
      {
        "h": "Cómo enviamos",
        "p": [
          "Preparamos tu pedido en cuanto se confirma el pago y lo entregamos a la agencia de transporte el mismo día o el siguiente día laborable.",
          "Cuando tu pedido se ponga en camino, te enviaremos por correo electrónico la información de seguimiento, si está disponible."
        ]
      },
      {
        "h": "Plazos de entrega",
        "p": [
          "Plazo de entrega estimado: 24/48 horas (días laborables) para los pedidos realizados antes de las 14:00 (hora peninsular española). Los pedidos realizados después de las 14:00 se preparan y envían el siguiente día laborable.",
          "Nos comprometemos a entregar en un plazo máximo de 30 días naturales. Si no fuera posible, podrás resolver el contrato y te reembolsaremos la totalidad de lo pagado."
        ]
      },
      {
        "h": "Gastos de envío",
        "p": [
          "Envío gratuito en pedidos iguales o superiores a 30 €.",
          "En pedidos inferiores a 30 €, los gastos de envío son de 4,99 €.",
          "El precio final, con IVA y gastos de envío incluidos, se muestra siempre antes de pagar. No pagarás IVA de importación, aranceles ni gastos de gestión adicionales en el momento de la entrega."
        ]
      },
      {
        "h": "Devoluciones y desistimiento",
        "p": [
          "Dispones de 14 días naturales desde la recepción para desistir de tu compra sin justificación.",
          "Para iniciar una devolución, escríbenos a {{EMAIL}} indicando tu número de pedido y te explicaremos el procedimiento y la dirección de devolución. El coste directo de la devolución corre a tu cargo.",
          "Te reembolsaremos a la misma tarjeta, a través de Stripe, en un máximo de 14 días desde que nos comuniques tu decisión, pudiendo retener el reembolso hasta recibir el producto o la prueba de su envío. Encontrarás el detalle completo y el formulario en la página de Derecho de Desistimiento y Devoluciones."
        ]
      },
      {
        "h": "Garantía",
        "p": [
          "Todos los productos tienen una garantía legal de conformidad de 3 años desde la entrega. Si tu producto presenta un defecto, contáctanos en {{EMAIL}} con tu número de pedido y lo resolveremos mediante reparación, sustitución o, cuando proceda, rebaja del precio o reembolso.",
          "{{MARCA}} es tu único interlocutor para la garantía, con independencia de que el producto proceda de un proveedor internacional."
        ]
      }
    ]
  }
};
