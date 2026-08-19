import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ESTILOS, construirPrompt, getEstilo} from './estilos';
import {FORMATOS} from './formatos';

test('la v1 publica exactamente cinco estilos', () => {
  assert.equal(ESTILOS.length, 5);
});

test('los ids son únicos', () => {
  assert.equal(new Set(ESTILOS.map((e) => e.id)).size, ESTILOS.length);
});

test('en v1 todos se resuelven por formato y ese formato existe', () => {
  const ids = new Set(FORMATOS.map((f) => f.id));
  for (const e of ESTILOS) {
    assert.equal(e.resuelvePor, 'formato');
    assert.ok(ids.has(e.referencia), `${e.id} apunta a un formato inexistente`);
  }
});

test('un estilo sólo publica formatos que hoy se pueden renderizar', () => {
  // La regla que ya costó caro con faceless/noticiero: si el catálogo lo
  // muestra, el /render tiene que poder producirlo.
  const elegibles = new Set(['fullscreen', 'split', 'pip', 'versus', 'pizarra']);
  for (const e of ESTILOS) {
    assert.ok(
      elegibles.has(e.referencia),
      `${e.id} publica "${e.referencia}", que no es elegible desde el MANIFEST`,
    );
  }
});

test('todo prompt trae las tres partes', () => {
  for (const e of ESTILOS) {
    const p = construirPrompt(e.id);
    assert.match(p, /bootstrap/, `${e.id}: falta la parte de instalación`);
    assert.match(p, /sem[áa]ntico/i, `${e.id}: falta el recorte semántico`);
    assert.match(p, new RegExp(e.referencia), `${e.id}: falta el formato`);
    // Sin MANIFEST el prompt describe un estilo pero no produce nada: el
    // render se alimenta del MANIFEST, no del prompt.
    assert.match(p, /MANIFEST\.md/, `${e.id}: no manda escribir el MANIFEST`);
    assert.match(p, /keyword/i, `${e.id}: no dice que los cues van por keyword`);
    assert.match(p, /BORRADOR_AUTO\.mp4/, `${e.id}: no pide el render final`);
  }
});

test('el prompt dice de qué video habla', () => {
  // Una sesión limpia sobre una carpeta necesita saber qué archivo abrir.
  for (const e of ESTILOS) {
    assert.match(construirPrompt(e.id), /en esta carpeta/, `${e.id}`);
  }
});

test('versus pide los dos apoyos visuales, que son el formato entero', () => {
  assert.match(construirPrompt('versus'), /DOS apoyos visuales/);
});

test('el prompt declara los requisitos duros del estilo', () => {
  const pip = construirPrompt('pip');
  assert.match(pip, /CANVAS\//, 'pip debe pedir la carpeta CANVAS/');
  const pizarra = construirPrompt('pizarra');
  assert.match(pizarra, /remove-background/, 'pizarra debe pedir el cutout');
});

test('todo estilo tiene descripción, señales de uso y demo', () => {
  for (const e of ESTILOS) {
    assert.ok(e.descripcion.length > 0, `${e.id} sin descripción`);
    assert.ok(e.cuandoUsar.length > 0, `${e.id} sin cuandoUsar`);
    assert.match(e.demo, /^estilos\/.+\.mp4$/, `${e.id}: demo mal formado`);
  }
});

test('construirPrompt tira error con un id desconocido', () => {
  assert.throws(() => construirPrompt('no-existe'));
});

test('getEstilo devuelve undefined para un id desconocido', () => {
  assert.equal(getEstilo('no-existe'), undefined);
});
