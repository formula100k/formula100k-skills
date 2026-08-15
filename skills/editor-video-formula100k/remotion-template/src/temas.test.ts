import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TEMAS, getTema} from './temas';

const CLAVES: Array<keyof ReturnType<typeof getTema>> = [
  'fondo', 'texto', 'acento', 'cajaFondo', 'cajaTexto',
  'fuenteDisplay', 'fuenteCuerpo', 'trazoTexto',
  'captionTexto', 'captionTrazo',
];

test('v1 trae exactamente dos temas', () => {
  assert.deepEqual(Object.keys(TEMAS).sort(), ['crema-editorial', 'default']);
});

test('todo tema define todos los tokens', () => {
  for (const [id, tema] of Object.entries(TEMAS)) {
    for (const clave of CLAVES) {
      assert.ok(tema[clave], `tema "${id}" sin token "${String(clave)}"`);
    }
  }
});

test('getTema cae al default ante un id desconocido', () => {
  assert.equal(getTema('inventado'), TEMAS.default);
});

test('los colores son hex de 7 caracteres', () => {
  for (const [id, tema] of Object.entries(TEMAS)) {
    for (const clave of ['fondo', 'texto', 'acento', 'cajaFondo', 'cajaTexto', 'captionTexto'] as const) {
      assert.match(tema[clave], /^#[0-9a-fA-F]{6}$/, `${id}.${clave}`);
    }
  }
});
