/* ============================================================
   recetario.js — Menú + ficha + minijuego (drag & drop) + confeti
   ------------------------------------------------------------
   Flujo: menú → ficha (Preparar) → juego (arrastrar ingredientes
   al plato en orden) → felicitación + confeti.
   El orden se valida por ÍNDICE del paso (permite repetir emoji,
   p. ej. pan abajo / pan arriba).
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     1. DATOS — 5 hamburguesas (reemplaza imágenes y textos luego)
     ============================================================ */
  const HAMBURGUESAS = [
    {
      nombre: 'Clásica Doble',
      img: 'https://picsum.photos/seed/burger-clasica/900/900',
      desc: 'La receta base que perfeccioné primero: doble carne, queso fundido y todo lo fresco. Es la que más repito porque gusta a todo el mundo.',
      pasos: [
        { emoji: '🍞', nombre: 'Pan de abajo' },
        { emoji: '🥬', nombre: 'Lechuga' },
        { emoji: '🥩', nombre: 'Primera carne' },
        { emoji: '🧀', nombre: 'Queso' },
        { emoji: '🥩', nombre: 'Segunda carne' },
        { emoji: '🍅', nombre: 'Tomate' },
        { emoji: '🧅', nombre: 'Cebolla' },
        { emoji: '🥯', nombre: 'Pan de arriba' }
      ]
    },
    {
      nombre: 'BBQ Bacon',
      img: 'https://picsum.photos/seed/burger-bbq/900/900',
      desc: 'Carne, bacon crujiente y un toque de salsa barbacoa casera. Es la hamburguesa de los días de fiesta: contundente y con mucho sabor.',
      pasos: [
        { emoji: '🍞', nombre: 'Pan de abajo' },
        { emoji: '🥓', nombre: 'Bacon' },
        { emoji: '🥩', nombre: 'Carne' },
        { emoji: '🧀', nombre: 'Queso' },
        { emoji: '🧅', nombre: 'Cebolla' },
        { emoji: '🥫', nombre: 'Salsa BBQ' },
        { emoji: '🥓', nombre: 'Más bacon' },
        { emoji: '🥯', nombre: 'Pan de arriba' }
      ]
    },
    {
      nombre: 'Veggie Total',
      img: 'https://picsum.photos/seed/burger-veggie/900/900',
      desc: 'Mi versión sin carne: todo verdura y mucho color. Descubrí que una hamburguesa vegetariana puede ser igual de jugosa si montas bien las capas.',
      pasos: [
        { emoji: '🍞', nombre: 'Pan de abajo' },
        { emoji: '🥬', nombre: 'Lechuga' },
        { emoji: '🍄', nombre: 'Champiñones' },
        { emoji: '🍅', nombre: 'Tomate' },
        { emoji: '🥑', nombre: 'Aguacate' },
        { emoji: '🥒', nombre: 'Pepino' },
        { emoji: '🧀', nombre: 'Queso' },
        { emoji: '🥯', nombre: 'Pan de arriba' }
      ]
    },
    {
      nombre: 'La Picante',
      img: 'https://picsum.photos/seed/burger-picante/900/900',
      desc: 'Para cuando quiero algo con chispa. El picante va de menos a más: la salsa pica primero y el jalapeño remata al final.',
      pasos: [
        { emoji: '🍞', nombre: 'Pan de abajo' },
        { emoji: '🌶️', nombre: 'Salsa picante' },
        { emoji: '🥩', nombre: 'Carne' },
        { emoji: '🧀', nombre: 'Queso' },
        { emoji: '🌶️', nombre: 'Jalapeños' },
        { emoji: '🧅', nombre: 'Cebolla' },
        { emoji: '🥬', nombre: 'Lechuga' },
        { emoji: '🥯', nombre: 'Pan de arriba' }
      ]
    },
    {
      nombre: 'Doble Queso',
      img: 'https://picsum.photos/seed/burger-doble-queso/900/900',
      desc: 'La más simple y la más adictiva: carne, queso, carne, queso. El truco está en tapar la carne y esperar a que el queso se funda.',
      pasos: [
        { emoji: '🍞', nombre: 'Pan de abajo' },
        { emoji: '🥩', nombre: 'Carne' },
        { emoji: '🧀', nombre: 'Queso' },
        { emoji: '🥩', nombre: 'Carne' },
        { emoji: '🧀', nombre: 'Queso' },
        { emoji: '🥒', nombre: 'Pepinillos' },
        { emoji: '🥯', nombre: 'Pan de arriba' }
      ]
    }
  ];

  /* ============================================================
     2. REFERENCIAS
     ============================================================ */
  const $ = function (id) { return document.getElementById(id); };
  const pantallaMenu = $('pantalla-menu');
  const pantallaJuego = $('pantalla-juego');
  const grid = $('grid-burgers');
  const ficha = $('ficha');
  const juegoNombre = $('juego-nombre');
  const listaPasos = $('lista-pasos');
  const inventario = $('inventario');
  const plato = document.querySelector('.plato');
  const platoCapas = $('plato-capas');
  const mensajeError = $('mensaje-error');
  const fin = $('fin');
  const finTexto = $('fin-texto');

  let actual = -1;     // índice de la hamburguesa abierta
  let pasoActual = 0;  // paso que toca colocar
  let pasoAltura = 0;  // px que ocupa cada capa (calculado según nº pasos)

  /* ============================================================
     3. NAVEGACIÓN (volver atrás / a la web, siempre disponible)
     ============================================================ */
  function irMenu() {
    fin.hidden = true;
    ficha.hidden = true;
    pantallaJuego.classList.remove('activa');
    pantallaMenu.classList.add('activa');
    window.scrollTo(0, 0);
  }
  function irWeb() {
    window.close();
    setTimeout(function () { if (!window.closed) location.href = 'index.html'; }, 120);
  }
  $('btn-web').addEventListener('click', irWeb);
  $('btn-salir').addEventListener('click', irMenu);
  $('btn-fin-menu').addEventListener('click', irMenu);
  $('btn-fin-web').addEventListener('click', irWeb);
  $('btn-menu').addEventListener('click', function () { ficha.hidden = true; });

  /* ============================================================
     4. RENDER DEL MENÚ
     ============================================================ */
  function renderMenu() {
    HAMBURGUESAS.forEach(function (h, i) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'burger-card';
      card.addEventListener('click', function () { abrirFicha(i); });
      card.innerHTML =
        '<div class="burger-media"><img src="' + h.img + '" alt="' + h.nombre + '" loading="lazy"></div>' +
        '<div class="burger-body"><h3>' + h.nombre + '</h3><span class="burger-ver">Ver ficha →</span></div>';
      grid.appendChild(card);
    });
  }

  /* ============================================================
     5. FICHA
     ============================================================ */
  function abrirFicha(i) {
    actual = i;
    const h = HAMBURGUESAS[i];
    $('ficha-img').src = h.img;
    $('ficha-img').alt = h.nombre;
    $('ficha-nombre').textContent = h.nombre;
    $('ficha-desc').textContent = h.desc;
    $('ficha-kicker').textContent = 'receta ' + String(i + 1).padStart(2, '0') + ' / ' + HAMBURGUESAS.length;
    ficha.hidden = false;
  }
  $('btn-preparar').addEventListener('click', function () {
    if (actual < 0) return;
    ficha.hidden = true;
    iniciarJuego(actual);
  });

  /* ============================================================
     6. JUEGO
     ============================================================ */
  function barajar(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function iniciarJuego(i) {
    const h = HAMBURGUESAS[i];
    pasoActual = 0;
    juegoNombre.textContent = h.nombre;
    listaPasos.innerHTML = '';
    inventario.innerHTML = '';
    platoCapas.innerHTML = '';

    // Lista de pasos en orden
    h.pasos.forEach(function (p, idx) {
      const li = document.createElement('li');
      li.innerHTML = '<span class="p-num">' + String(idx + 1).padStart(2, '0') + '</span> ' + p.nombre;
      if (idx === 0) li.classList.add('is-current');
      listaPasos.appendChild(li);
    });

    pantallaMenu.classList.remove('activa');
    pantallaJuego.classList.add('activa');
    window.scrollTo(0, 0);

    // Calculamos cuánto ocupa cada capa según el nº de pasos,
    // para que QUEPAN TODAS dentro del plato (no se salgan arriba).
    const alturaZona = platoCapas.clientHeight || 300;
    pasoAltura = alturaZona / h.pasos.length;
    const tamEmoji = Math.max(28, Math.min(72, pasoAltura * 1.5)); // tamaño del emoji apilado

    // Inventario barajado (el orden real se valida por índice)
    barajar(h.pasos.map(function (p, idx) { return { p: p, idx: idx }; })).forEach(function (item) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ing';
      b.dataset.idx = String(item.idx);
      b.innerHTML =
        '<span class="ing-emoji">' + item.p.emoji + '</span>' +
        '<span class="ing-nombre">' + item.p.nombre + '</span>';
      b.addEventListener('pointerdown', function (e) { startDrag(e, b, item.idx, tamEmoji); });
      inventario.appendChild(b);
    });
  }

  $('btn-reset').addEventListener('click', function () { if (actual >= 0) iniciarJuego(actual); });

  /* ============================================================
     7. ARRASTRAR INGREDIENTE (Pointer Events: ratón + táctil)
     ------------------------------------------------------------
     - pointerdown: creamos un "fantasma" que sigue al puntero.
     - pointermove: movemos el fantasma y marcamos el plato como
       destino si estamos encima.
     - pointerup: si soltamos SOBRE el plato y es el ingrediente
       correcto → se coloca; si es incorrecto → vuelve al
       inventario con aviso; si soltamos fuera → vuelve sin aviso.
     ============================================================ */
  function startDrag(e, boton, idx, tamEmoji) {
    if (boton.disabled || !pantallaJuego.classList.contains('activa')) return;
    e.preventDefault();

    const rect = boton.getBoundingClientRect();
    const emoji = HAMBURGUESAS[actual].pasos[idx].emoji;

    // Fantasma
    const fantasma = document.createElement('span');
    fantasma.className = 'ing-fantasma';
    fantasma.textContent = emoji;
    fantasma.style.left = (rect.left + rect.width / 2) + 'px';
    fantasma.style.top = (rect.top + rect.height / 2) + 'px';
    document.body.appendChild(fantasma);
    boton.style.opacity = '0';

    const onMove = function (ev) {
      fantasma.style.left = ev.clientX + 'px';
      fantasma.style.top = ev.clientY + 'px';
      plato.classList.toggle('destino', sobrePlato(ev.clientX, ev.clientY));
    };
    const onUp = function (ev) {
      try { boton.releasePointerCapture(ev.pointerId); } catch (err) {}
      boton.removeEventListener('pointermove', onMove);
      boton.removeEventListener('pointerup', onUp);
      boton.removeEventListener('pointercancel', onUp);
      plato.classList.remove('destino');

      if (sobrePlato(ev.clientX, ev.clientY) && idx === pasoActual) {
        colocar(fantasma, boton, idx, tamEmoji);
      } else {
        if (sobrePlato(ev.clientX, ev.clientY)) error('Ese no — toca: ' + HAMBURGUESAS[actual].pasos[pasoActual].nombre);
        devolver(fantasma, boton, rect);
      }
    };

    try { boton.setPointerCapture(e.pointerId); } catch (err) {}
    boton.addEventListener('pointermove', onMove);
    boton.addEventListener('pointerup', onUp);
    boton.addEventListener('pointercancel', onUp);
  }

  function sobrePlato(x, y) {
    const r = plato.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  /* ---- Colocar en el plato: el fantasma vuela a su sitio ---- */
  function colocar(fantasma, boton, idx, tamEmoji) {
    const r = platoCapas.getBoundingClientRect();
    const destinoX = r.left + r.width / 2;
    const destinoY = r.bottom - (idx * pasoAltura) - (pasoAltura / 2);
    fantasma.style.left = destinoX + 'px';
    fantasma.style.top = destinoY + 'px';
    fantasma.style.transform = 'translate(-50%,-50%)';
    fantasma.style.opacity = '0';

    fantasma.addEventListener('transitionend', function () {
      fantasma.remove();
      anadirCapa(idx, tamEmoji);
    }, { once: true });
    setTimeout(function () {
      if (document.body.contains(fantasma)) { fantasma.remove(); anadirCapa(idx, tamEmoji); }
    }, 600);

    boton.classList.add('usado');
    boton.disabled = true;
    marcarPaso();
    pasoActual++;
    if (pasoActual >= HAMBURGUESAS[actual].pasos.length) terminar(HAMBURGUESAS[actual]);
  }

  /* ---- Añadir la capa real al plato (centrada, en su altura) ---- */
  function anadirCapa(idx, tamEmoji) {
    const capa = document.createElement('div');
    capa.className = 'capa-ing';
    capa.textContent = HAMBURGUESAS[actual].pasos[idx].emoji;
    capa.style.bottom = (idx * pasoAltura) + 'px';
    capa.style.fontSize = tamEmoji + 'px';
    capa.style.transform = 'translateX(-50%) rotate(' + (Math.random() * 8 - 4).toFixed(1) + 'deg)';
    platoCapas.appendChild(capa);
  }

  /* ---- Devolver el fantasma al inventario (animación de vuelta) ---- */
  function devolver(fantasma, boton, rect) {
    fantasma.style.left = (rect.left + rect.width / 2) + 'px';
    fantasma.style.top = (rect.top + rect.height / 2) + 'px';
    fantasma.style.transform = 'translate(-50%,-50%)';
    fantasma.style.opacity = '0';
    const fin2 = function () { fantasma.remove(); boton.style.opacity = ''; };
    fantasma.addEventListener('transitionend', fin2, { once: true });
    setTimeout(fin2, 500);
  }

  function marcarPaso() {
    const li = listaPasos.children[pasoActual];
    if (!li) return;
    li.classList.remove('is-current');
    li.classList.add('is-done');
    const siguiente = listaPasos.children[pasoActual + 1];
    if (siguiente) siguiente.classList.add('is-current');
  }

  let errorTimer = null;
  function error(msg) {
    mensajeError.textContent = msg;
    mensajeError.classList.add('visible');
    clearTimeout(errorTimer);
    errorTimer = setTimeout(function () { mensajeError.classList.remove('visible'); }, 1800);
  }

  /* ============================================================
     8. FINAL: felicitación + confeti
     ============================================================ */
  function terminar(h) {
    setTimeout(function () {
      finTexto.textContent = '«' + h.nombre + '» montada en orden perfecto. ¡Se sirve!';
      fin.hidden = false;
      lanzarConfeti();
    }, 450);
  }

  /* ============================================================
     9. CONFETI (canvas 2D, sin librerías)
     ============================================================ */
  const canvas = $('confeti');
  const ctx = canvas.getContext('2d');
  const COLORES = ['#7c3aed', '#2563eb', '#ec4899', '#a78bfa', '#38bdf8', '#fbcfe8'];
  let particulas = [];
  let confetiActivo = false;

  function lanzarConfeti() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particulas = [];
    for (let i = 0; i < 160; i++) {
      particulas.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.5,
        w: 6 + Math.random() * 8,
        h: 8 + Math.random() * 10,
        vx: (Math.random() - 0.5) * 2.5,
        vy: 2 + Math.random() * 3.5,
        rot: Math.random() * 360,
        vr: (Math.random() - 0.5) * 10,
        color: COLORES[Math.floor(Math.random() * COLORES.length)]
      });
    }
    if (!confetiActivo) { confetiActivo = true; requestAnimationFrame(dibujarConfeti); }
  }

  function dibujarConfeti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let vivas = 0;
    for (let i = 0; i < particulas.length; i++) {
      const p = particulas[i];
      p.vy += 0.05;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.y < canvas.height + 30) {
        vivas++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    }
    if (vivas > 0) {
      requestAnimationFrame(dibujarConfeti);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      confetiActivo = false;
    }
  }

  /* ============================================================
     10. ARRANQUE
     ============================================================ */
  renderMenu();
})();