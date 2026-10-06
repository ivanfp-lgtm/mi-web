/* ============================================================
   museo.js — Cámara FPS (CSS 3D) + caminar + apuntado + notas
   ------------------------------------------------------------
   - WASD / flechas          -> caminar (adelante según la mirada)
   - Click DERECHO mantenido -> pointer lock -> mirar
   - Click IZQUIERDO         -> abre la ficha del cuadro apuntado
   ============================================================ */
(function () {
  'use strict';

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
     ------------------------------------------------------------
     yaw   = giro horizontal (cámara)
     pitch = vertical (cámara)
     pos   = posición de la cámara en el mundo (x,z en el suelo)
     View matrix = inversa de la cámara:
       rotateX(-pitch) rotateY(-yaw) translate3d(-pos)
     ============================================================ */
  let yaw = 0, pitch = 0;
  const pos = { x: 0, y: 0, z: 0 };

  const SENS      = 0.12;     // grados por píxel de ratón
  const PITCH_LIM = 80;       // no dar vueltas de campana
  const DELTA_MAX = 120;      // tope de movimiento por evento (evita saltos)
  const VEL       = 900;      // px/s al caminar
  const HALF      = 2600;     // coincide con --half (mitad del ANCHO)
  const MARGEN    = 700;      // distancia mínima a las paredes
  const LIMITE    = HALF - MARGEN;

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

  /* ---- Pointer lock (mirar con click derecho) ---- */
  let esperaMov = false;      // ignora el 1er mousemove al activar el lock

  function pedirLock() { if (viewport.requestPointerLock) viewport.requestPointerLock(); }
  function soltarLock() { if (document.exitPointerLock) document.exitPointerLock(); }

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

    // FIX: el 1er evento al entrar en lock suele traer un salto -> se ignora
    if (esperaMov) { esperaMov = false; return; }

    // FIX: tope al delta por si el navegador manda un valor extremo
    const dx = Math.max(-DELTA_MAX, Math.min(DELTA_MAX, e.movementX));
    const dy = Math.max(-DELTA_MAX, Math.min(DELTA_MAX, e.movementY));

    yaw   -= dx * SENS;       // ratón derecha = girar derecha
    pitch += dy * SENS;       // FIX: ratón arriba = mirar arriba (antes al revés)
    pitch = Math.max(-PITCH_LIM, Math.min(PITCH_LIM, pitch));
  });

  document.addEventListener('pointerlockchange', function () {
    const on = document.pointerLockElement === viewport;
    viewport.classList.toggle('looking', on);
    if (on) esperaMov = true; // al entrar, descartamos el 1er movimiento
  });

  /* ---- Teclas para caminar ---- */
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

  // Avanzar según hacia dónde mira la cámara (solo plano horizontal)
  function caminar(dt) {
    if (!note.hidden) return;                 // congelado con la ficha abierta
    const r  = yaw * Math.PI / 180;
    const fx = -Math.sin(r), fz = -Math.cos(r);   // forward (hacia donde miras)
    const rx =  Math.cos(r), rz = -Math.sin(r);   // right (strafe)
    const v  = VEL * dt;
    if (teclas.up)    { pos.x += fx * v; pos.z += fz * v; }
    if (teclas.down)  { pos.x -= fx * v; pos.z -= fz * v; }
    if (teclas.right) { pos.x += rx * v; pos.z += rz * v; }
    if (teclas.left)  { pos.x -= rx * v; pos.z -= rz * v; }
    clampPos();
  }

  /* ============================================================
     3. APUNTADO por crosshair
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

  /* ============================================================
     4. NOTA
     ============================================================ */
  function abrirApuntado() {
    if (apuntado < 0) return;
    const obra = OBRAS[apuntado];
    noteImg.src = obra.src;
    noteImg.alt = obra.titulo;
    noteTitle.textContent = obra.titulo;
    noteDesc.textContent = obra.descripcion;
    note.hidden = false;
    soltarLock();
  }
  function cerrarNota() { note.hidden = true; }
  noteClose.addEventListener('click', cerrarNota);
  note.addEventListener('click', function (e) { if (e.target === note) cerrarNota(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarNota(); });

  /* ============================================================
     5. VOLVER
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
    actualizarApuntado();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

})();