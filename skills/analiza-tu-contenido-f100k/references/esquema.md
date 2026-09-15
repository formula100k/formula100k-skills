# Esquemas

## datos.json (entrada del motor)

```json
{
  "cuenta": { "handle": "tucuenta", "fuente": "panel «Ver insights» de Instagram, leído el 2026-09-15" },
  "proposito_mes": "Crecimiento",
  "piezas_mes": 12,
  "ventanas": null,
  "posts": [
    {
      "n": 1,
      "fecha": "2026-09-02",
      "url": "https://www.instagram.com/reel/CODE/",
      "portada": "portadas/01_CODE.jpg",
      "duracion_s": 42,
      "caption": "…",
      "transcript": "…",
      "sin_voz": false,
      "metricas": {
        "vistas": 13537, "pct_no_seguidores": 63.3,
        "likes": 385, "comentarios": 30, "guardados": 133, "compartidos": 40,
        "seguidores_nuevos": 3,
        "retencion_3s": null, "duracion_media": null,
        "visitas_perfil": null, "toques_enlace": null, "dms": null
      },
      "etiquetas": { "formato": "Comparación", "angulo": "Error común", "proposito": "Crecimiento" }
    }
  ]
}
```

- `n`: 1 = el más nuevo. `fecha` en AAAA-MM-DD.
- `ventanas`: `null` el primer mes (el motor parte 20 viejos / 10 nuevos). Desde el segundo mes: `{ "base": [n…], "mes": [n…] }`.
- `ventana.dias_publicando` (opcional): si la cuenta lleva más días publicando que lo que abarca el lote.
- Números crudos: `7479.5`, nunca `"7.479,5"`. Lo que no hay es `null`.

## lectura.json (lo que redacta la IA)

```json
{
  "resumen": "Tu filtro tapado es el Alcance: …",
  "videos": { "1": { "gancho": "primera frase literal", "idea": "de qué va" } },
  "preguntas": [
    { "id": "p1", "tipo": "hipotesis", "pregunta": "¿…?", "porque": "…", "evidencia": [18, 29], "destino": "…" },
    { "id": "e1", "tipo": "encuesta", "pregunta": "Cuéntame con tus palabras…", "porque": "…" }
  ],
  "conclusiones": [ { "titulo": "…", "texto": "…", "evidencia": [29, 30] } ],
  "aplicacion": {
    "calendario": [
      { "semana": 1, "tema": "…", "formato": "…", "angulo": "…", "proposito": "Crecimiento",
        "de_donde_sale": "REPETIR", "filtro_que_ataca": "1 Alcance", "por_que": "…", "evidencia": [18] }
    ],
    "campana": null,
    "sin_campana": "…",
    "apuesta": { "formato": "…", "por_que": "…", "tasa_mediana": 0.21,
      "ganchos": { "A": "…", "B": "…", "C": "…", "D": "…" } },
    "esta_semana": ["…", "…", "…"]
  }
}
```
