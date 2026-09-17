# Invitación de Denisse Yamilet

## Datos confirmados

- Fecha: sábado 19 de septiembre de 2026
- Festejada: Denisse Yamilet Gómez Gutiérrez
- Edad: 15 años
- Mamá: Mónica Gómez Gutiérrez
- Ceremonia: Parroquia San Pedro Apóstol
- Dirección de ceremonia: Fray Daniel Mireles 295, León, Gto. 37280
- Hora de misa: 4:00 p. m.
- Recepción: Quinta San Francisco
- Dirección de recepción: P.º de los Ángeles y Medina 314, León, Gto. 37235
- Llegada a recepción: 7:00–7:30 p. m.
- Cena: 7:30–8:30 p. m.
- Inicio de protocolo: 8:30 p. m.
- Vestido: verde pistache
- Diseño: sin temática; paleta fija en pistache, salvia, oliva, dorado y marfil
- Google Maps de la ceremonia: https://maps.google.com/maps/search/Parroquia%20San%20Pedro%20Ap%C3%B3stol/@21.12083498,-101.63637189,17z?hl=es
- Google Maps de la recepción: https://maps.google.com/maps/search/Quinta%20San%20Francisco/@21.13904639,-101.63363475,17z?hl=es

## Selector de fotos

- `selector.html` — selección privada (noindex). 191 fotos en `img/`
  con miniatura en `img/thumb/`. La lista se regenera con
  `python generate_photo_list.py`.
- `album.html` — álbum de solo lectura para compartir
  (`album.html?filtro=album`, `?filtro=impresion`, …).
- Evento en Supabase: slug `xv-denisse-yamilet`, `limite_impresion` 100,
  `costo_foto_adicional` 15.

## Pendientes

- **Confirmar el paquete contratado.** `js/config.js` usa 100 impresiones
  5x7 + 1 ampliación 50x60 cm, tomado de `eventos.limite_impresion` en
  Supabase. Si el contrato es de 50 fotos, cambiar `limiteImpresion` en
  `js/config.js` y la fila del evento en Supabase.
- Nombre del papá, si se incluirá
- Padrinos
- Canción principal
- Nombre y teléfono para confirmaciones
- Frase, dedicatoria o versículo

## Dominio previsto

`https://denisse-yamilet.invitados.org`
