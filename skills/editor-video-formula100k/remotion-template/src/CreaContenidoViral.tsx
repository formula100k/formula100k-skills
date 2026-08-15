import React from 'react';
import type {CreaContenidoViralProps, FormatoProps} from './types';
import {FORMATO_DEFAULT, getFormato} from './formatos';
import {COMPONENTES_FORMATO} from './formatos/index';

// ──────────────────────────────────────────────────────────────────────
// Despachador de formatos de edición.
//
// Resuelve formato/tema/subtítulos a partir de props opcionales + el
// registro (`formatos.ts`) y delega el ensamblado real en el componente
// correspondiente de `COMPONENTES_FORMATO`. El componente hijo recibe
// `FormatoProps`: los tres campos ya son obligatorios, así que no debe
// volver a resolver defaults.
// ──────────────────────────────────────────────────────────────────────

export const CreaContenidoViral: React.FC<CreaContenidoViralProps> = (props) => {
  const pedido = props.formato ?? FORMATO_DEFAULT;
  const defPedido = getFormato(pedido);
  const id = defPedido && COMPONENTES_FORMATO[pedido] ? pedido : FORMATO_DEFAULT;

  if (id !== pedido) {
    console.warn(`[warn] formato "${pedido}" sin componente — uso ${FORMATO_DEFAULT}`);
  }

  const def = getFormato(id)!;
  let subtitulos = props.subtitulos ?? (def.capasDefault.captions ?? false);

  // Sin transcript no hay de dónde sacar los subtítulos: se apagan con aviso
  // en vez de renderizar una capa vacía en silencio.
  if (subtitulos && props.transcript.length === 0) {
    console.warn('[warn] subtítulos pedidos pero el transcript está vacío — los apago');
    subtitulos = false;
  }

  const Componente = COMPONENTES_FORMATO[id];
  const resueltas: FormatoProps = {
    ...props,
    formato: id,
    tema: props.tema ?? def.temaDefault,
    subtitulos,
  };
  return <Componente {...resueltas} />;
};
