# Casting de un avatar nuevo: brief → referencias → ficha

> La calidad del avatar no nace solo en el prompt: nace en la referencia.

Solo para **avatares de IA nuevos** (marca, UGC, personaje de corto). Para una persona real
se salta este paso: su cara es la referencia.

---

## 1. Del brief a 4 datos

Si hay brief de marca o de clienta, se extraen estos 4 datos antes de buscar nada:

| Dato | Pregunta | Ejemplo (marca de skincare de gama media-alta) |
|---|---|---|
| **Marca / uso** | ¿Dónde va a vivir el avatar? | Instagram: reels con el producto en la mano |
| **Tono** | ¿Cómo se tiene que sentir? | aspiracional pero cercana, «real pero estética» |
| **Rasgos** | edad, piel, pelo, nivel de producción | 25–30, piel sana y luminosa, castaño natural con ondas sueltas, poco maquillaje, «alguien de la calle» |
| **Ropa** | prendas, colores, marcas que se parecen | básicos de algodón y lino estilo COS o UNIQLO, crema, blanco roto, beige y topo, sin accesorios llamativos |

Si falta alguno, se pregunta una sola vez y en una línea.

## 2. Referencias de cara (mínimo 4)

- **Pinterest es la mesa de trabajo**: tiene muy buena calidad media y en 10 minutos arma un moodboard.
- Buscar con **5 o 6 palabras clave**: rasgos · etnia · edad · expresión · energía.
  Ej.: `latina woman wavy hair natural freckles 25 soft smile`.
- **Buscar en inglés**: salen mejores referencias.
- Se guardan de 4 a 6 caras en `<carpeta>/_casting/caras/`.

## 3. Referencias de ropa (el outfit cuenta el 50 % de la historia)

- **3 o 4 palabras clave**: prenda · color · textura · accesorio · actitud.
  Ej.: `men streetwear outfit`, `streetstyle woman`, `summer streetwear outfits woman`,
  `vintage hoodie men`, `y2k outfit women`.
- **Las marcas de ropa** sirven como alternativa a Pinterest: deportiva (Nike), editorial
  (Jacquemus), streetwear (Nude Project). De la marca se toma la **prenda**, nunca el logo: el
  filtro de Seedance bloquea marcas.
- Menú rápido de 8 estilos para elegir: **streetwear · techwear · editorial · luxury ·
  cyberpunk · Y2K · funk brasileño · skater.**
- Que la ropa vaya con el avatar. Ej.: para un modelo de skincare masculino, unos básicos
  limpios en tonos claros y no streetwear cargado.

🔴 **Cómo se busca:** a mano o con el navegador, **en serie y con pausas**, de 4 a 10 imágenes
por búsqueda. **Nunca se baja Pinterest en masa con un script**: suspenden la cuenta. Lo más simple es que la persona pase los pines que
le gustan.

## 4. Lo que hace memorable a un avatar (revisar antes de generar)

| | Qué es | Ejemplo |
|---|---|---|
| **Pelo llamativo** | un color, un corte o una textura que no se pueden ignorar | buzzcut azul, pelo rosa |
| **Accesorio raro** | UN objeto que se pondría siempre | gafas de sol siempre puestas |
| **Contraste de estilo** | algo elegante con algo de calle: tensión, no armonía | traje con zapatillas |
| **Actitud concreta** | una mirada, una postura o un gesto: una persona, no «una modelo» | media sonrisa de lado |
| **Una sola frase** | si no se resume en una línea, todavía no existe | «el golfista de pelo rosa que nunca se quita los lentes» |
| **Se repite** | se reconoce aunque cambien la ropa, la pose y la luz | — |

De ahí sale el **SIGNO DISTINTIVO**: de 2 a 3 rasgos que van en TODAS las tomas. Ej.: pelo rosa,
gafas de sol siempre y bigote rubio platino. Va escrito en la ficha y en cada prompt de toma.

> Para un avatar «real pero estético», como uno de skincare, el signo va **bajito**: un lunar, unas
> pecas o un corte de pelo. El contraste fuerte se guarda para avatares de moda o de personaje.

## 5. Ficha de casting (orden que mejor sostiene la cara)

```
NOMBRE:           <minúsculas-con-guiones, es el nombre del Element>
EDAD Y ORIGEN:    <27 · Milán, Italia>
PELO:             <largo · forma · color · raya>
PIEL:             <tono · textura real con poros · pecas/lunares con su lugar>
CEJAS · OJOS · NARIZ · LABIOS: <...>
CUERPO:           <altura · peso aprox. · complexión · proporciones>
SIGNO DISTINTIVO: <2–3 rasgos que van siempre>
ESTILO:           <uno de los 8 o el del brief + 3–4 prendas base>
ACTITUD:          <mirada, postura, gesto>
UNA FRASE:        <el avatar en una línea>
```

Las **medidas del cuerpo** (altura, peso y complexión) frenan que el cuerpo cambie entre tomas.
Antes solo se fijaba la cara.
