import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FORMATOS, getFormato, FORMATO_DEFAULT} from './formatos';

test('hay exactamente cinco formatos', () => {
  assert.equal(FORMATOS.length, 5);
});

test('los ids son únicos', () => {
  const ids = FORMATOS.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('el catálogo contiene los cinco formatos esperados', () => {
  const ids = FORMATOS.map((f) => f.id).sort();
  assert.deepEqual(ids, ['faceless', 'fullscreen', 'noticiero', 'pip', 'split']);
});

test('capasDefault sólo menciona capas que el formato admite', () => {
  for (const f of FORMATOS) {
    for (const capa of Object.keys(f.capasDefault)) {
      assert.ok(
        f.capas.includes(capa as never),
        `${f.id}: capasDefault menciona "${capa}" que no está en capas`,
      );
    }
  }
});

test('todo formato tiene descripción y al menos una señal de uso', () => {
  for (const f of FORMATOS) {
    assert.ok(f.descripcion.length > 0, `${f.id} sin descripción`);
    assert.ok(f.cuandoUsar.length > 0, `${f.id} sin cuandoUsar`);
  }
});

test('los defaults de subtítulos coinciden con el diseño aprobado', () => {
  const esperado: Record<string, boolean> = {
    fullscreen: false, split: true, pip: true, faceless: true, noticiero: false,
  };
  for (const f of FORMATOS) {
    assert.equal(f.capasDefault.captions ?? false, esperado[f.id], `${f.id}`);
  }
});

test('getFormato devuelve undefined para un id desconocido', () => {
  assert.equal(getFormato('inventado'), undefined);
});

test('el formato default existe en el catálogo', () => {
  assert.ok(getFormato(FORMATO_DEFAULT));
});
