/* ============================================================
   museo.js — Cámara FPS (CSS 3D) + caminar + apuntado + notas
   ------------------------------------------------------------
   ESCRITORIO: WASD/flechas + click derecho (mirar) + click izq (ficha por crosshair)
   MÓVIL:      arrastrar (mirar) + joystick (caminar) + tap (ficha por toque)
   La capa táctil solo se activa si esMovil; en escritorio no cambia nada.
   ============================================================ */
(function () {
  'use strict';

  /* ---- ¿dispositivo táctil? ---- */
  const esMovil = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  /* ============================================================
     CONFIGURACIÓN DE LOS CUADROS
     pared: 'front' | 'right' | 'left'  (la 'back' queda vacía)
     ============================================================ */
  const OBRAS = [
    {
      pared: 'front',
      src: 'https://picsum.photos/seed/oc-personaje-uno/900/900',
      titulo: 'OC · Personaje 1',
      resumen: 'Ficha corta (placa)',
      descripcion: 'Descripción larga del primer OC. Aquí cuentas su historia, diseño, técnica usada, etc. Cambia este texto por el tuyo.'
    },
    {
      pared: 'right',
      src: 'https://picsum.photos/seed/oc-personaje-dos/700/1000',
      titulo: 'OC · Personaje 2',
      resumen: 'Ficha corta (placa)',
      descripcion: 'Descripción larga del segundo OC. Al ser vertical, en el lienzo cuadrado se recorta solo el centro.'
    },
    {
      pared: 'left',
      src: 'https://picsum.photos/seed/oc-personaje-tres/1200/800',
      titulo: 'OC · Personaje 3',
      resumen: 'Ficha corta (placa)',
      descripcion: 'Descripción larga del tercer OC. Al ser apaisado, también se recorta al centro del lienzo cuadrado.'
    }
  ];

  /* ============================================================
     REFERENCIAS
     ============================================================ */
  const viewport  = document.getElementById('viewport');
  const world     = document.getElementById('world');
  const note      = document.getElementById('note');
  const noteImg   = document.getElementById('note-img');
  const noteTitle = document.getElementById('note-title');
  const noteDesc  = document.getElementById('note-desc');
  const noteClose = document.getElementById('note-close');
  const hudBack   = document.getElementById('hud-back');

  /* ============================================================
     1. CONSTRUIR LA HABITACIÓN
     ============================================================ */
  function makeFace(clase) {
    const f = document.createElement('div');
    f.className = 'face face--' + clase;
    return f;
  }
  world.appendChild(makeFace('floor'));
  world.appendChild(makeFace('ceiling'));
  world.appendChild(makeFace('back'));   // pared trasera VACÍA

  const faces = {
    front: makeFace('front'),
    right: makeFace('right'),
    left:  makeFace('left')
  };

  OBRAS.forEach(function (obra, i) {
    const wrap = document.createElement('div');
    wrap.className = 'painting';
    wrap.dataset.paint = String(i);
    wrap.innerHTML =
      '<div class="painting-frame">' +
        '<div class="painting-canvas"><img src="' + obra.src + '" alt="' + obra.titulo + '"></div>' +
      '</div>' +
      '<div class="painting-plaque">' +
        '<h3>' + obra.titulo + '</h3><p>' + obra.resumen + '</p>' +
      '</div>';
    faces[obra.pared].appendChild(wrap);
  });
  Object.keys(faces).forEach(function (k) { world.appendChild(faces[k]); });

  /* ============================================================
     2. ESTADO DE CÁMARA
     ============================================================ */
  let yaw = 0, pitch = 0;
  const pos = { x: 0, y: 0, z: 0 };

  const SENS        = 0.12;     // grados por píxel (ratón / dedo)
  const PITCH_LIM   = 80;       // no dar vueltas de campana
  const DELTA_MAX   = 120;      // tope por evento (evita saltos del pointer lock)
  const VEL         = 900;      // px/s al caminar
  const HALF        = 2600;     // coincide con --half (mitad del ANCHO)
  const MARGEN      = 700;      // distancia mínima a las paredes
  const LIMITE      = HALF - MARGEN;

  function clampPos() {
    pos.x = Math.max(-LIMITE, Math.min(LIMITE, pos.x));
    pos.z = Math.max(-LIMITE, Math.min(LIMITE, pos.z));
  }

  function aplicarCamara() {
    world.style.transform =
      'rotateX(' + (-pitch) + 'deg) ' +
      'rotateY(' + (-yaw)   + 'deg) ' +
      'translate3d(' + (-pos.x) + 'px,' + (-pos.y) + 'px,' + (-pos.z) + 'px)';
  }

  /* ---- Pointer lock (solo escritorio) ---- */
  let esperaMov = false;
  function pedirLock() { if (viewport.requestPointerLock) viewport.requestPointerLock(); }
  function soltarLock() { if (document.exitPointerLock) document.exitPointerLock(); }

  /* ============================================================
     3. ENTRADA DE ESCRITORIO (mouse + teclado)
     ------------------------------------------------------------
     Se ignoran los eventos de ratón si es móvil (el preventDefault
     táctil ya mata los sintéticos; esto es doble seguro).
     ============================================================ */
  if (!esMovil) {
    viewport.addEventListener('mousedown', function (e) {
      if (e.button === 2) pedirLock();
      else if (e.button === 0) abrirApuntado();
    });
    viewport.addEventListener('mouseup', function (e) {
      if (e.button === 2) soltarLock();
    });
    viewport.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    document.addEventListener('mousemove', function (e) {
      if (document.pointerLockElement !== viewport) return;
      if (esperaMov) { esperaMov = false; return; }
      const dx = Math.max(-DELTA_MAX, Math.min(DELTA_MAX, e.movementX));
      const dy = Math.max(-DELTA_MAX, Math.min(DELTA_MAX, e.movementY));
      yaw   -= dx * SENS;     // ratón derecha = girar derecha
      pitch += dy * SENS;     // ratón arriba = mirar arriba
      pitch = Math.max(-PITCH_LIM, Math.min(PITCH_LIM, pitch));
    });

    document.addEventListener('pointerlockchange', function () {
      const on = document.pointerLockElement === viewport;
      viewport.classList.toggle('looking', on);
      if (on) esperaMov = true;
    });
  }

  /* ---- Teclas para caminar (escritorio) ---- */
  const teclas = Object.create(null);
  const MAPA = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right'
  };
  window.addEventListener('keydown', function (e) {
    if (MAPA[e.code]) { teclas[MAPA[e.code]] = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', function (e) {
    if (MAPA[e.code]) teclas[MAPA[e.code]] = false;
  });
  window.addEventListener('blur', function () { for (const k in teclas) teclas[k] = false; });

  /* ============================================================
     4. ENTRADA TÁCTIL (solo móvil): mirar + tap
     ============================================================ */
  let joyX = 0, joyY = 0;   // joystick analógico (-1..1)

  if (esMovil) {
    let tId = null, tX = 0, tY = 0, tAcum = 0;
    const UMBRAL_TAP = 10;   // px: por debajo, es tap; por encima, es arrastre

    viewport.addEventListener('touchstart', function (e) {
      if (tId !== null) return;            // ya hay un dedo mirando
      const t = e.changedTouches[0];
      tId = t.identifier;
      tX = t.clientX; tY = t.clientY; tAcum = 0;
      e.preventDefault();                  // mata scroll/zoom + ratón sintético
    }, { passive: false });

    viewport.addEventListener('touchmove', function (e) {
      const t = buscarTouch(e.changedTouches, tId);
      if (!t) return;
      const dx = t.clientX - tX;
      const dy = t.clientY - tY;
      tX = t.clientX; tY = t.clientY;
      tAcum += Math.abs(dx) + Math.abs(dy);
      // Mismos signos que escritorio: dedo derecha=girar derecha, arriba=mirar arriba
      yaw   -= dx * SENS;
      pitch += dy * SENS;
      pitch = Math.max(-PITCH_LIM, Math.min(PITCH_LIM, pitch));
      e.preventDefault();
    }, { passive: false });

    viewport.addEventListener('touchend', function (e) {
      const t = buscarTouch(e.changedTouches, tId);
      if (!t) return;
      if (tAcum < UMBRAL_TAP) abrirPorToque(t.clientX, t.clientY);
      tId = null;
    });
    viewport.addEventListener('touchcancel', function () { tId = null; });

    crearJoystick();
  }

  function buscarTouch(lista, id) {
    for (let i = 0; i < lista.length; i++) if (lista[i].identifier === id) return lista[i];
    return null;
  }

  /* ---- Joystick virtual (creado solo en móvil) ---- */
  function crearJoystick() {
    const base = document.createElement('div');
    base.className = 'joy';
    const nub = document.createElement('div');
    nub.className = 'joy-nub';
    base.appendChild(nub);
    document.body.appendChild(base);

    let jId = null, cx = 0, cy = 0, R = 0;

    base.addEventListener('touchstart', function (e) {
      if (jId !== null) return;
      const t = e.changedTouches[0];
      jId = t.identifier;
      const r = base.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
      R = r.width / 2;
      moverNub(t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });

    base.addEventListener('touchmove', function (e) {
      const t = buscarTouch(e.changedTouches, jId);
      if (!t) return;
      moverNub(t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });

    function soltar() {
      jId = null; joyX = 0; joyY = 0;
      nub.style.transform = '';
    }
    base.addEventListener('touchend', soltar);
    base.addEventListener('touchcancel', soltar);

    function moverNub(px, py) {
      let dx = px - cx, dy = py - cy;
      const d = Math.hypot(dx, dy);
      if (d > R) { dx = dx / d * R; dy = dy / d * R; }   // limitar al radio
      nub.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      joyX = Math.max(-1, Math.min(1, dx / R));          // strafe
      joyY = Math.max(-1, Math.min(1, -dy / R));         // arriba = +1 (avanzar)
    }
  }

  /* ============================================================
     5. CAMINAR (unifica teclado + joystick)
     ============================================================ */
  function caminar(dt) {
    if (!note.hidden) return;                 // congelado con la ficha abierta

    // Input binario de teclado
    let iy = (teclas.up ? 1 : 0) - (teclas.down ? 1 : 0);
    let ix = (teclas.right ? 1 : 0) - (teclas.left ? 1 : 0);

    // Sumar joystick analógico (0 en escritorio)
    iy = Math.max(-1, Math.min(1, iy + joyY));
    ix = Math.max(-1, Math.min(1, ix + joyX));

    if (iy === 0 && ix === 0) return;

    const mag = Math.min(1, Math.hypot(ix, iy));         // empujar poco = lento
    const r = yaw * Math.PI / 180;
    const fx = -Math.sin(r), fz = -Math.cos(r);          // forward
    const rx =  Math.cos(r), rz = -Math.sin(r);          // right
    const v = VEL * dt * mag;

    pos.x += (fx * iy + rx * ix) * v;
    pos.z += (fz * iy + rz * ix) * v;
    clampPos();
  }

  /* ============================================================
     6. APUNTADO por crosshair (solo escritorio)
     ============================================================ */
  let apuntado = -1;
  function actualizarApuntado() {
    const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    const painting = el ? el.closest('.painting') : null;
    const nuevo = painting ? Number(painting.dataset.paint) : -1;
    if (nuevo !== apuntado) {
      apuntado = nuevo;
      document.querySelectorAll('.painting').forEach(function (p) {
        p.classList.toggle('aimed', Number(p.dataset.paint) === apuntado);
      });
    }
  }
  function limpiarAimed() {
    document.querySelectorAll('.painting.aimed').forEach(function (p) {
      p.classList.remove('aimed');
    });
    apuntado = -1;
  }

  /* ============================================================
     7. NOTA (ficha a pantalla)
     ============================================================ */
  function abrirObra(i) {
    if (i < 0 || !OBRAS[i]) return;
    const obra = OBRAS[i];
    noteImg.src = obra.src;
    noteImg.alt = obra.titulo;
    noteTitle.textContent = obra.titulo;
    noteDesc.textContent = obra.descripcion;
    note.hidden = false;
    soltarLock();
  }
  function abrirApuntado() { abrirObra(apuntado); }            // escritorio (crosshair)
  function abrirPorToque(x, y) {                                // móvil (tap)
    const el = document.elementFromPoint(x, y);
    const painting = el ? el.closest('.painting') : null;
    if (painting) abrirObra(Number(painting.dataset.paint));
  }
  function cerrarNota() { note.hidden = true; }
  noteClose.addEventListener('click', cerrarNota);
  note.addEventListener('click', function (e) { if (e.target === note) cerrarNota(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarNota(); });

  /* ============================================================
     8. VOLVER
     ============================================================ */
  hudBack.addEventListener('click', function () {
    soltarLock();
    window.close();
    setTimeout(function () { if (!window.closed) location.href = 'index.html'; }, 120);
  });

  /* ============================================================
     BUCLE PRINCIPAL
     ============================================================ */
  let last = null;
  function loop(now) {
    if (last === null) last = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    caminar(dt);
    aplicarCamara();
    if (!esMovil) actualizarApuntado(); else limpiarAimed();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

})();