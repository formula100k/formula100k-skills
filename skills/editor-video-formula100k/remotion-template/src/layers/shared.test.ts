import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveBroll} from './shared';
import type {TranscriptWord} from '../types';

// Transcript sintético: una palabra por segundo.
const transcript: TranscriptWord[] = [
  {word: 'antes', start: 0, end: 1},
  {word: 'ahora', start: 2, end: 3},
  {word: 'luego', start: 4, end: 5},
];

test('el clamp NO corta entre lados opuestos — versus muestra los dos a la vez', () => {
  const out = resolveBroll(
    [
      {keyword: 'antes', src: 'a.png', duration: 10, lado: 'a'},
      {keyword: 'ahora', src: 'b.png', duration: 10, lado: 'b'},
    ],
    transcript,
  );
  const ladoA = out.find((c) => c.lado === 'a');
  assert.ok(ladoA);
  // Sin el clamp por lado, el cue del lado B (start=2) recortaría éste a end=2.
  assert.equal(ladoA.end, 10, 'el lado A se cortó al entrar el lado B');
});

test('el clamp SÍ corta dentro del mismo lado', () => {
  const out = resolveBroll(
    [
      {keyword: 'antes', src: 'a1.png', duration: 10, lado: 'a'},
      {keyword: 'ahora', src: 'a2.png', duration: 10, lado: 'a'},
    ],
    transcript,
  );
  assert.equal(out[0].end, 2, 'el primer cue debía terminar donde empieza el segundo');
});

test('sin `lado` todo cae en "a" — comportamiento idéntico al de antes', () => {
  const out = resolveBroll(
    [
      {keyword: 'antes', src: 'a.png', duration: 10},
      {keyword: 'ahora', src: 'b.png', duration: 10},
    ],
    transcript,
  );
  assert.deepEqual(out.map((c) => c.lado), ['a', 'a']);
  assert.equal(out[0].end, 2, 'el clamp de siempre dejó de aplicar');
});
