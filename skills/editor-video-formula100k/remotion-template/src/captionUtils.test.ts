import {test} from 'node:test';
import assert from 'node:assert/strict';
import {agruparCaptions, marcarDestacados} from './captionUtils';

const w = (text: string, start: number, end: number) => ({text, start, end});

test('un transcript vacío produce cero chunks', () => {
  assert.deepEqual(agruparCaptions([]), []);
});

test('agrupa hasta maxPalabras por chunk', () => {
  const chunks = agruparCaptions(
    [w('uno', 0, 0.3), w('dos', 0.3, 0.6), w('tres', 0.6, 0.9)], 3, 0.6,
  );
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].text, 'uno dos tres');
  assert.equal(chunks[0].start, 0);
  assert.equal(chunks[0].end, 0.9);
});

test('parte en un chunk nuevo al superar maxPalabras', () => {
  const chunks = agruparCaptions(
    [w('a', 0, 0.2), w('b', 0.2, 0.4), w('c', 0.4, 0.6), w('d', 0.6, 0.8)], 3, 0.6,
  );
  assert.equal(chunks.length, 2);
  assert.equal(chunks[1].text, 'd');
});

test('una pausa larga corta el chunk aunque quepan más palabras', () => {
  const chunks = agruparCaptions(
    [w('a', 0, 0.2), w('b', 1.5, 1.7), w('c', 1.7, 1.9)], 3, 0.6,
  );
  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].text, 'a');
  assert.equal(chunks[1].text, 'b c');
});

test('marcarDestacados señala la palabra que coincide con una keyword', () => {
  const chunks = marcarDestacados(
    [{text: 'esto es prueba', start: 0, end: 1}], ['prueba'],
  );
  assert.equal(chunks[0].destacado, 'prueba');
});

test('marcarDestacados ignora acentos y mayúsculas', () => {
  const chunks = marcarDestacados(
    [{text: 'la EDICIÓN manda', start: 0, end: 1}], ['edicion'],
  );
  assert.equal(chunks[0].destacado, 'EDICIÓN');
});

test('marcarDestacados deja destacado sin definir si no hay coincidencia', () => {
  const chunks = marcarDestacados([{text: 'nada aquí', start: 0, end: 1}], ['otra']);
  assert.equal(chunks[0].destacado, undefined);
});
