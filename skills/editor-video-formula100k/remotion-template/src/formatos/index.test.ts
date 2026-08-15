import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FORMATOS} from '../formatos';
import {COMPONENTES_FORMATO} from './index';

test('todo formato de la familia reel tiene componente', () => {
  const reel = FORMATOS.filter((f) => f.modo === 'reel').map((f) => f.id).sort();
  assert.deepEqual(Object.keys(COMPONENTES_FORMATO).sort(), reel);
});

test('no hay componentes huérfanos sin entrada en el registro', () => {
  const ids = new Set(FORMATOS.map((f) => f.id));
  for (const id of Object.keys(COMPONENTES_FORMATO)) {
    assert.ok(ids.has(id), `componente "${id}" no está en formatos.ts`);
  }
});
