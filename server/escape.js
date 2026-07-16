// Escapa los caracteres especiales de HTML. Se aplica a todo valor que
// venga del cliente antes de interpolarlo en los emails o en los
// mensajes HTML de Telegram, para que nadie pueda inyectar etiquetas.
export const escapeHtml = (valor) =>
  String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
