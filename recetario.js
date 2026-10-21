/* ============================================================
   recetario.js — Menú + ficha + minijuego (drag & drop) + confeti
   ------------------------------------------------------------
   Dos modos por receta:
   - FOTOS: cada paso tiene img + fase. Al acertar, la imagen del
     plato se sustituye por la fase (Fases/1.png, 2.png...) con un
     crossfade entre dos capas. Los ingredientes NO se apilan.
   - EMOJIS: si el paso solo tiene emoji, se apila sobre el plato.
   El inventario se DEDUPLICA por ingrediente (misma img o mismo
   emoji sale una sola vez), pero puede arrastrarse varias veces:
   se acierta cuando la imagen del tile coincide con el paso actual.
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     1. DATOS
     ============================================================ */
  const CARPETA = 'Imagenes/Recetario/';
  const PLATO_VACIO = CARPETA + 'Plato.png';

  const HAMBURGUESAS = [
    {
      nombre: 'Mermelada de bacon',
      // La portada es la fase final (la hamburguesa terminada)
      img: CARPETA + 'Mermelada de bacon/Fases/7.png',
      desc: 'Mi favorita para comidas especiales: pan de brioche, mayonesa con especias, cebolla, bacon glaseado con mermelada, carne de cerdo y cheddar fundido. El contraste dulce-salado es lo que la hace adictiva.',
      pasos: [
        { nombre: 'Pan de abajo',          img: CARPETA + 'Mermelada de bacon/Pan de abajo.png',          fase: CARPETA + 'Mermelada de bacon/Fases/1.png' },
        { nombre: 'Mayonesa con especias', img: CARPETA + 'Mermelada de bacon/Mayonesa con especias.png', fase: CARPETA + 'Mermelada de bacon/Fases/2.png' },
        { nombre: 'Cebolla',               img: CARPETA + 'Mermelada de bacon/Cebolla.png',               fase: CARPETA + 'Mermelada de bacon/Fases/3.png' },
        { nombre: 'Bacon con mermelada',   img: CARPETA + 'Mermelada de bacon/Bacon con mermelada.png',   fase: CARPETA + 'Mermelada de bacon/Fases/4.png' },
        { nombre: 'Carne de cerdo',        img: CARPETA + 'Mermelada de bacon/Carne de cerdo.png',        fase: CARPETA + 'Mermelada de bacon/Fases/5.png' },
        { nombre: 'Cheddar',               img: CARPETA + 'Mermelada de bacon/Chedar.png',                fase: CARPETA + 'Mermelada de bacon/Fases/6.png' },
        { nombre: 'Pan de arriba',         img: CARPETA + 'Mermelada de bacon/Pan de arriba.png',         fase: CARPETA + 'Mermelada de bacon/Fases/7.png' }
      ]
    },
    {
      nombre: 'Serrana',
      img: CARPETA + 'Serrana/Fases/7.png',
      desc: 'Un homenaje a lo clásico español: jamón serrano sobre carne de cerdo, con cebolla, cheddar fundido y una mayonesa de yema que lo une todo. Simple, contundente y muy nuestra.',
      pasos: [
        { nombre: 'Pan de abajo',      img: CARPETA + 'Serrana/Pan de abajo.png',            fase: CARPETA + 'Serrana/Fases/1.png' },
        { nombre: 'Mayonesa con yema', img: CARPETA + 'Serrana/Mayonasa con llema.png',      fase: CARPETA + 'Serrana/Fases/2.png' },
        { nombre: 'Cebolla',           img: CARPETA + 'Serrana/Cebolla.png',                 fase: CARPETA + 'Serrana/Fases/3.png' },
        { nombre: 'Jamón serrano',     img: CARPETA + 'Serrana/Jamón serrano.png',           fase: CARPETA + 'Serrana/Fases/4.png' },
        { nombre: 'Carne de cerdo',    img: CARPETA + 'Serrana/Carne de cerdo.png',          fase: CARPETA + 'Serrana/Fases/5.png' },
        { nombre: 'Cheddar',           img: CARPETA + 'Serrana/Chedar.png',                  fase: CARPETA + 'Serrana/Fases/6.png' },
        { nombre: 'Pan de arriba',     img: CARPETA + 'Serrana/Pan de arriba.png',           fase: CARPETA + 'Serrana/Fases/7.png' }
      ]
    },
    {
      nombre: 'Carbonara',
      img: CARPETA + 'Carbonara/Fases/6.png',
      desc: 'La más cremosa de todas: la salsa carbonara hace de hilo conductor y va en dos capas, una abajo y otra arriba de la carne, para que cada bocado quede bien empapado. Con bacon y cerdo, es un festín.',
      pasos: [
        { nombre: 'Pan de abajo',    img: CARPETA + 'Carbonara/Pan de abajo.png',      fase: CARPETA + 'Carbonara/Fases/1.png' },
        { nombre: 'Carbonara',       img: CARPETA + 'Carbonara/Carbonara.png',         fase: CARPETA + 'Carbonara/Fases/2.png' },
        { nombre: 'Bacon',           img: CARPETA + 'Carbonara/Bacon.png',             fase: CARPETA + 'Carbonara/Fases/3.png' },
        { nombre: 'Carne de cerdo',  img: CARPETA + 'Carbonara/Carne de cerdo.png',    fase: CARPETA + 'Carbonara/Fases/4.png' },
        { nombre: 'Carbonara',       img: CARPETA + 'Carbonara/Carbonara.png',         fase: CARPETA + 'Carbonara/Fases/5.png' },
        { nombre: 'Pan de arriba',   img: CARPETA + 'Carbonara/Pan de arriba.png',     fase: CARPETA + 'Carbonara/Fases/6.png' }
      ]
    },
    {
      nombre: 'Almussafes',
      img: CARPETA + 'Almussafes/Fases/8.png',
      desc: 'La receta con más carácter: sobrasada untable, miel para equilibrar, rúcula fresca y queso de cabra sobre carne de ternera. Dulce, salado y un punto amargo que la hace redonda. Un homenaje a mi pueblo.',
      pasos: [
        { nombre: 'Pan de abajo',     img: CARPETA + 'Almussafes/Pan de abajo.png',      fase: CARPETA + 'Almussafes/Fases/1.png' },
        { nombre: 'Sobrasada',        img: CARPETA + 'Almussafes/Sobrasada.png',         fase: CARPETA + 'Almussafes/Fases/2.png' },
        { nombre: 'Cebolla',          img: CARPETA + 'Almussafes/Cebolla.png',           fase: CARPETA + 'Almussafes/Fases/3.png' },
        { nombre: 'Carne de ternera', img: CARPETA + 'Almussafes/Carne de ternera.png',  fase: CARPETA + 'Almussafes/Fases/4.png' },
        { nombre: 'Miel',             img: CARPETA + 'Almussafes/Miel.png',              fase: CARPETA + 'Almussafes/Fases/5.png' },
        { nombre: 'Rúcula',           img: CARPETA + 'Almussafes/Rucula.png',            fase: CARPETA + 'Almussafes/Fases/6.png' },
        { nombre: 'Queso de cabra',   img: CARPETA + 'Almussafes/Queso de cabra.png',    fase: CARPETA + 'Almussafes/Fases/7.png' },
        { nombre: 'Pan de arriba',    img: CARPETA + 'Almussafes/Pan de arriba.png',     fase: CARPETA + 'Almussafes/Fases/8.png' }
      ]
    },
    {
      nombre: 'Pollo',
      img: CARPETA + 'Pollo/Fases/6.png',
      desc: 'El clásico pollo con patatas, pero en hamburguesa: carne de pollo, cebolla y patatas paja crujientes ligadas con una salsa cremosa. La más informal y la que más me sale cuando tengo prisa.',
      pasos: [
        { nombre: 'Pan de abajo',    img: CARPETA + 'Pollo/Pan de abajo.png',      fase: CARPETA + 'Pollo/Fases/1.png' },
        { nombre: 'Salsa',           img: CARPETA + 'Pollo/Salsa.png',             fase: CARPETA + 'Pollo/Fases/2.png' },
        { nombre: 'Cebolla',         img: CARPETA + 'Pollo/Cebolla.png',           fase: CARPETA + 'Pollo/Fases/3.png' },
        { nombre: 'Patatas paja',    img: CARPETA + 'Pollo/Patatas paja.png',      fase: CARPETA + 'Pollo/Fases/4.png' },
        { nombre: 'Carne de pollo',  img: CARPETA + 'Pollo/Carne de pollo.png',    fase: CARPETA + 'Pollo/Fases/5.png' },
        { nombre: 'Pan de arriba',   img: CARPETA + 'Pollo/Pan de arriba.png',     fase: CARPETA + 'Pollo/Fases/6.png' }
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
  const platoBase = document.querySelector('.plato-base');
  const platoCapas = $('plato-capas');
  const mensajeError = $('mensaje-error');
  const toast = $('toast');
  const toastMsg = $('toast-msg');

  let actual = -1;        // índice de la hamburguesa abierta
  let pasoActual = 0;     // paso que toca colocar
  let pasoAltura = 0;     // px por capa (solo modo emoji)
  let tamEmoji = 40;      // tamaño emoji apilado (solo modo emoji)

  // Estado del crossfade de fases (dos capas)
  let platoFase = null;       // segunda capa, creada por JS
  let capaFront = null;       // capa de arriba (imagen actual, opaca)
  let capaBack = null;        // capa de abajo (recibe la siguiente fase)
  let faseAnimando = false;
  let fasePendiente = null;

  /* ============================================================
     3. NAVEGACIÓN
     ============================================================ */
  function irMenu() {
    ficha.hidden = true;
    ocultarAviso();
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

  // Contenido del tile: imagen (recetas con fotos) o emoji (pruebas)
  function contenidoIng(paso) {
    if (paso.img) {
      return '<span class="ing-img"><img src="' + paso.img + '" alt="' + paso.nombre + '"></span>';
    }
    return '<span class="ing-emoji">' + paso.emoji + '</span>';
  }

  // Clave única de un ingrediente (su imagen o su emoji)
  function claveIng(paso) {
    return paso.img ? 'i:' + paso.img : 'e:' + paso.emoji;
  }

  function iniciarJuego(i) {
    const h = HAMBURGUESAS[i];
    pasoActual = 0;
    // Limpieza por si venimos de una receta terminada con confeti/aviso
    ocultarAviso(true);
    juegoNombre.textContent = h.nombre;
    listaPasos.innerHTML = '';
    inventario.innerHTML = '';
    platoCapas.innerHTML = '';

    // Plato vacío al empezar + reinicio del crossfade (sin animar)
    platoBase.style.transition = 'none';
    platoBase.style.backgroundImage = 'url("' + PLATO_VACIO + '")';
    platoBase.style.opacity = '1';
    platoBase.style.zIndex = '2';
    if (platoFase) {
      platoFase.style.transition = 'none';
      platoFase.style.opacity = '0';
      platoFase.style.zIndex = '1';
    }
    void platoBase.offsetWidth;          // fijar el estado sin transición
    platoBase.style.transition = '';     // devolver la transición de la hoja
    if (platoFase) platoFase.style.transition = '';
    capaFront = platoBase;
    capaBack = platoFase;
    faseAnimando = false;
    fasePendiente = null;

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

    // Medidas para el modo emoji (apilado dentro del plato)
    const alturaZona = platoCapas.clientHeight || 300;
    pasoAltura = alturaZona / h.pasos.length;
    tamEmoji = Math.max(28, Math.min(72, pasoAltura * 1.5));

    // Inventario: UN tile por ingrediente (dedup por imagen/emoji).
    // El mismo tile puede arrastrarse varias veces si la receta lo pide.
    const vistos = Object.create(null);
    const unicos = [];
    h.pasos.forEach(function (p) {
      const k = claveIng(p);
      if (!vistos[k]) { vistos[k] = true; unicos.push(p); }
    });

    barajar(unicos).forEach(function (paso) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ing';
      if (paso.img) { b.dataset.img = paso.img; } else { b.dataset.emoji = paso.emoji; }
      b.innerHTML = contenidoIng(paso) + '<span class="ing-nombre">' + paso.nombre + '</span>';
      b.addEventListener('pointerdown', function (e) { startDrag(e, b); });
      inventario.appendChild(b);
    });
  }

  $('btn-reset').addEventListener('click', function () { if (actual >= 0) iniciarJuego(actual); });

  /* ============================================================
     7. ARRASTRAR (Pointer Events: ratón + táctil)
     ------------------------------------------------------------
     El tile representa un INGREDIENTE. Se acierta si su imagen/emoji
     coincide con el del paso actual (pasoActual), no por posición.
     ============================================================ */
  function startDrag(e, boton) {
    const h = HAMBURGUESAS[actual];
    if (!pantallaJuego.classList.contains('activa')) return;
    if (pasoActual >= h.pasos.length) return;   // receta ya terminada
    e.preventDefault();

    const imgTile = boton.dataset.img || '';
    const emojiTile = boton.dataset.emoji || '';

    const rect = boton.getBoundingClientRect();

    // Fantasma que sigue al puntero (foto o emoji según el tile)
    const fantasma = document.createElement('span');
    fantasma.className = 'ing-fantasma';
    if (imgTile) {
      fantasma.innerHTML = '<img src="' + imgTile + '" alt="">';
    } else {
      fantasma.textContent = emojiTile;
    }
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

      // ¿Coincide este ingrediente con el paso que toca?
      const pasoToca = h.pasos[pasoActual];
      const coincide = (pasoToca.img && imgTile === pasoToca.img) ||
                       (pasoToca.emoji && emojiTile === pasoToca.emoji);

      if (sobrePlato(ev.clientX, ev.clientY) && coincide) {
        colocar(fantasma, boton);
      } else {
        if (sobrePlato(ev.clientX, ev.clientY) && pasoActual < h.pasos.length) {
          error('Ese no — toca: ' + pasoToca.nombre);
        }
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

  /* ---- Acierto: se aplica el paso ACTUAL al instante ---- */
  function colocar(fantasma, boton) {
    const idx = pasoActual;

    fantasma.remove();          // sin vuelo ni desvanecido
    boton.style.opacity = '';   // el tile vuelve a estar visible

    aplicarPaso(idx);           // el plato pasa a la fase (con crossfade)
    marcarPaso();
    pasoActual++;
    if (pasoActual >= HAMBURGUESAS[actual].pasos.length) terminar(HAMBURGUESAS[actual]);
  }

  /* ---- Efecto del paso acertado ---- */
  function aplicarPaso(idx) {
    const paso = HAMBURGUESAS[actual].pasos[idx];
    if (paso.fase) {
      // Modo fotos: crossfade a la fase correspondiente
      cambiarFase(paso.fase);
    } else {
      // Modo emojis: se apila la capa
      const capa = document.createElement('div');
      capa.className = 'capa-ing';
      capa.textContent = paso.emoji;
      capa.style.bottom = (idx * pasoAltura) + 'px';
      capa.style.fontSize = tamEmoji + 'px';
      capa.style.transform = 'translateX(-50%) rotate(' + (Math.random() * 8 - 4).toFixed(1) + 'deg)';
      platoCapas.appendChild(capa);
    }
  }

  /* ---- Cambio de fase con crossfade (dos capas) ----
     La imagen nueva se coloca opaca en la capa de abajo y se
     desvanece la de arriba, revelándola (fundido limpio, sin
     parpadeo de fondo). Si llega un cambio mientras anima, se
     encola: gana siempre el último. */
  function cambiarFase(url) {
    if (faseAnimando) { fasePendiente = url; return; }
    faseAnimando = true;

    const saliente = capaFront;   // la que se va (arriba, opaca)
    const entrante = capaBack;    // la que llega (debajo)

    // Preparar la entrante opaca SIN animar (está tapada por la saliente)
    entrante.style.transition = 'none';
    entrante.style.backgroundImage = 'url("' + url + '")';
    entrante.style.opacity = '1';
    void entrante.offsetWidth;            // fijar estado
    entrante.style.transition = '';       // devolver la transición de la hoja

    // Desvanecer la saliente → aparece la entrante debajo
    saliente.style.opacity = '0';

    let hecho = false;
    const fin = function () {
      if (hecho) return; hecho = true;
      saliente.removeEventListener('transitionend', onEnd);
      // Asentar roles: la entrante pasa a arriba, la saliente a abajo
      saliente.style.zIndex = '1';
      entrante.style.zIndex = '2';
      capaFront = entrante;
      capaBack = saliente;
      faseAnimando = false;
      if (fasePendiente) {
        const p = fasePendiente; fasePendiente = null;
        cambiarFase(p);
      }
    };
    const onEnd = function (ev) {
      if (ev && ev.propertyName && ev.propertyName !== 'opacity') return;
      fin();
    };
    saliente.addEventListener('transitionend', onEnd);
    setTimeout(fin, 500);   // respaldo (reduced-motion o si no salta el evento)
  }

  /* ---- Fallo o fuera del plato: vuelve al inventario ---- */
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
     8. FINAL: aviso superior + confeti (sin bloquear la vista)
     ============================================================ */
  let avisoTimer = null;
  function terminar(h) {
    setTimeout(function () {
      toastMsg.textContent = '«' + h.nombre + '» montada en orden perfecto. ¡Se sirve!';
      toast.classList.add('visible');
      lanzarConfeti();
      // El aviso y el confeti desaparecen juntos tras un tiempo
      clearTimeout(avisoTimer);
      avisoTimer = setTimeout(ocultarAviso, 4200);
    }, 450);
  }

  // ocultarAviso(fuerte=true) corta el confeti de golpe (al reiniciar);
  // sin argumento, lo hace desvanecer junto al aviso.
  function ocultarAviso(fuerte) {
    clearTimeout(avisoTimer);
    toast.classList.remove('visible');
    if (fuerte) {
      particulas = [];
      confetiActivo = false;
      confetiForzado = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
      confetiForzado = true; // el bucle hará que las partículas se desvanezcan
    }
  }

  /* ============================================================
     9. CONFETI (canvas 2D, sin librerías)
     ============================================================ */
  const canvas = $('confeti');
  const ctx = canvas.getContext('2d');
  const COLORES = ['#ee00ff', '#0077ff', '#8c00ff'];
  let particulas = [];
  let confetiActivo = false;
  let confetiForzado = false;

  function lanzarConfeti() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particulas = [];
    confetiForzado = false;
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
        alpha: 1,
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
      if (confetiForzado) {
        p.alpha -= 0.06;
        if (p.alpha < 0) p.alpha = 0;
      }
      if (p.y < canvas.height + 30 && p.alpha > 0) {
        vivas++;
        ctx.save();
        ctx.globalAlpha = p.alpha;
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
      confetiForzado = false;
    }
  }

  /* ============================================================
     10. ARRANQUE
     ============================================================ */
  // Segunda capa de plato (para el crossfade de fases)
  platoFase = document.createElement('div');
  platoFase.className = 'plato-fase';
  platoFase.setAttribute('aria-hidden', 'true');
  plato.appendChild(platoFase);
  capaFront = platoBase;
  capaBack = platoFase;

  renderMenu();
})();