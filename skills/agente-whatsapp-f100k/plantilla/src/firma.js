// Comprueba que un mensaje que llega al webhook lo mandó Meta de verdad.
// Meta firma el cuerpo con tu App Secret y lo manda en el encabezado X-Hub-Signature-256.

import { createHmac, timingSafeEqual } from 'node:crypto';

export function firmaValida(cuerpoCrudo, encabezado, appSecret) {
  if (!appSecret || !encabezado || !encabezado.startsWith('sha256=')) return false;
  const esperada = 'sha256=' + createHmac('sha256', appSecret).update(cuerpoCrudo).digest('hex');
  const a = Buffer.from(esperada);
  const b = Buffer.from(encabezado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function firmar(cuerpoCrudo, appSecret) {
  return 'sha256=' + createHmac('sha256', appSecret).update(cuerpoCrudo).digest('hex');
}
