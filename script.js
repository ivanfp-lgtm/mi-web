/* ============================================================
   script.js — Web personal de Iván Gómez Navarro
   JavaScript puro, sin librerías.
   ------------------------------------------------------------
   Incluye:
   - Modo oscuro con guardado en localStorage
   - Marquesina controlada por CSS
   - Barra de renderizado sincronizada con %
   - Animaciones reveal / máscara
   - Texto scramble
   - Contadores de estadísticas
   - Navegación activa
   - Formulario mailto
   - Copiar correo
   - Año automático
   ============================================================ */

(function () {
  'use strict';

  // Referencias globales
  const doc = document;
  const root = doc.documentElement;

  // Preferencia del sistema para reducir movimiento
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Activamos clases que dependen de JS
  root.classList.add('js');

  /* ============================================================
     1. TOAST: aviso flotante reutilizable
     ============================================================ */
  function showToast(message) {
    let toast = doc.querySelector('.toast');

    // Si no existe, lo creamos
    if (!toast) {
      toast = doc.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      doc.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('show');

    // Cancelamos el temporizador anterior si existía
    clearTimeout(toast._hideTimer);

    // Lo ocultamos automáticamente
    toast._hideTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 2200);
  }

  /* ============================================================
     2. MODO OSCURO
     ------------------------------------------------------------
     Clave guardada en localStorage: 'ign-theme'
     Valores posibles: 'light' o 'dark'
     ============================================================ */
  const THEME_KEY = 'ign-theme';
  const themeToggle = doc.getElementById('theme-toggle');
  const themeMeta = doc.querySelector('meta[name="theme-color"]');
  const mqDark = window.matchMedia('(prefers-color-scheme: dark)');

  // Leer tema guardado
  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (e) {
      return null;
    }
  }

  // Guardar tema
  function storeTheme(value) {
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch (e) {
      // Si falla, simplemente no persistimos
    }
  }

  // Actualizar botón y theme-color según el modo
  function updateThemeUI(mode) {
    // Actualizamos el color del navegador/OS si existe meta theme-color
    if (themeMeta) {
      themeMeta.setAttribute('content', mode === 'dark' ? '#08060f' : '#f6f4fc');
    }

    // Actualizamos el botón si existe
    if (!themeToggle) return;

    const dark = mode === 'dark';

    // aria-pressed indica si el modo oscuro está activado
    themeToggle.setAttribute('aria-pressed', dark ? 'true' : 'false');

    // aria-label accesible
    themeToggle.setAttribute(
      'aria-label',
      dark ? 'Activar modo claro' : 'Activar modo oscuro'
    );

    // Icono y texto
    const icon = themeToggle.querySelector('.theme-icon');
    const text = themeToggle.querySelector('.theme-text');

    if (icon) {
      icon.textContent = dark ? '☀' : '☾';
    }

    if (text) {
      text.textContent = dark ? 'Claro' : 'Oscuro';
    }
  }

  // Aplicar tema
  function setTheme(mode, persist) {
    // Normalizamos el valor
    mode = mode === 'dark' ? 'dark' : 'light';

    // Lo aplicamos al <html>
    root.dataset.theme = mode;

    // Actualizamos UI del botón
    updateThemeUI(mode);

    // Persistimos solo si el usuario ha pulsado el botón
    if (persist) {
      storeTheme(mode);
    }
  }

  // Inicialización del tema
  let initialTheme = getStoredTheme();

  // Si no hay tema guardado, usamos el que puso el inline script
  // o, en su defecto, la preferencia del sistema
  if (initialTheme !== 'dark' && initialTheme !== 'light') {
    initialTheme = root.dataset.theme || (mqDark.matches ? 'dark' : 'light');
  }

  setTheme(initialTheme, false);

  // Evento del botón
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      setTheme(nextTheme, true);
      showToast(nextTheme === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado');
    });
  }

  // Si el usuario cambia el tema del sistema y no ha guardado uno propio,
  // seguimos la preferencia del sistema
  function onDarkChange(e) {
    if (!getStoredTheme()) {
      setTheme(e.matches ? 'dark' : 'light', false);
    }
  }

  if (mqDark.addEventListener) {
    mqDark.addEventListener('change', onDarkChange);
  } else if (mqDark.addListener) {
    // Compatibilidad con navegadores antiguos
    mqDark.addListener(onDarkChange);
  }

  /* ============================================================
     3. REDUCIR MOVIMIENTO
     ------------------------------------------------------------
     Si el usuario pidió reducir animaciones, mostramos todo
     directamente y evitamos animaciones complejas.
     ============================================================ */
  if (prefersReduced.matches) {
    // Mostrar elementos reveal y máscaras
    doc.querySelectorAll('.reveal, .mask').forEach(function (el) {
      el.classList.add('is-in');
    });

    // Rellenar barras de estadísticas
    doc.querySelectorAll('.stat-bar').forEach(function (bar) {
      bar.classList.add('is-filled');
    });

    // Poner números finales
    doc.querySelectorAll('.stat-num').forEach(function (num) {
      num.textContent = num.dataset.count || '0';
    });
  }

  /* ============================================================
     4. BARRA DE RENDERIZADO
     ------------------------------------------------------------
     Se llena, mantiene un momento y vuelve a bajar.
     El texto % está sincronizado con el ancho de la barra.
     ------------------------------------------------------------
     IMPORTANTE:
     Aquí se ha añadido forceLoadAnimation para que la barra
     funcione siempre, aunque el sistema tenga “reducir movimiento”.
     Cambia el valor a false si quieres respetar esa preferencia.
     ============================================================ */
  const pcLoad = doc.querySelector('.pc-load');

  if (pcLoad) {
    const bar = pcLoad.querySelector('.load-track i');
    const pct = pcLoad.querySelector('.pc-load-pct');
    const label = pcLoad.querySelector('[data-skill]');

    if (bar && pct) {
      // Si quieres que respete "reducir movimiento", pon false
      const forceLoadAnimation = true;

      // Frases que va rotando la etiqueta
      const phases = [
        'Renderizando',
        'Compilando',
        'Depurando',
        'Generando'
      ];

      // Duración total de un ciclo completo
      const cycle = 5200;

      // Control de requestAnimationFrame
      let rafId = null;
      let startTime = null;

      // Último valor mostrado para no actualizar DOM sin necesidad
      let lastPct = -1;
      let lastPhase = null;

      // Easing suave para que no parezca mecánica
      function easeInOutSine(x) {
        return -(Math.cos(Math.PI * x) - 1) / 2;
      }

      /*
         Curva de carga:
         0.00 a 0.45 -> sube hasta 100%
         0.45 a 0.55 -> se mantiene arriba
         0.55 a 1.00 -> baja hasta 0%
      */
      function loadProgress(t) {
        if (t < 0.45) {
          return easeInOutSine(t / 0.45);
        }

        if (t < 0.55) {
          return 1;
        }

        return 1 - easeInOutSine((t - 0.55) / 0.45);
      }

      // Actualiza barra y porcentaje
      function setLoad(progress) {
        const value = Math.max(0, Math.min(100, Math.round(progress * 100)));

        if (value !== lastPct) {
          bar.style.width = value + '%';
          pct.textContent = value + '%';
          lastPct = value;
        }
      }

      // Bucle principal
      function tick(now) {
        // Si forceLoadAnimation = false y el usuario pidió reducir movimiento, paramos
        if (!forceLoadAnimation && prefersReduced.matches) {
          stopLoad();
          setLoad(1);
          return;
        }

        // Inicializamos tiempo de inicio
        if (startTime === null) {
          startTime = now;
        }

        // Tiempo dentro del ciclo actual
        const elapsed = (now - startTime) % cycle;
        const t = elapsed / cycle;

        // Actualizamos barra
        setLoad(loadProgress(t));

        // Actualizamos etiqueta de fase
        if (label) {
          const phaseIndex = Math.floor(t * phases.length) % phases.length;

          if (phaseIndex !== lastPhase) {
            label.textContent = phases[phaseIndex];
            lastPhase = phaseIndex;
          }
        }

        // Seguimos animando
        rafId = requestAnimationFrame(tick);
      }

      // Inicia animación
      function startLoad() {
        if (rafId !== null) return;

        startTime = null;
        lastPhase = null;
        rafId = requestAnimationFrame(tick);
      }

      // Detiene animación
      function stopLoad() {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }

      if (!forceLoadAnimation && prefersReduced.matches) {
        setLoad(1);

        if (label) {
          label.textContent = 'Renderizando';
        }
      } else {
        // Iniciamos directamente para que no dependa de que el observer lo detecte.
        startLoad();

        // Y, si el navegador lo soporta, pausamos cuando salga de pantalla.
        if ('IntersectionObserver' in window) {
          const loadObserver = new IntersectionObserver(
            function (entries) {
              entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                  startLoad();
                } else {
                  stopLoad();
                }
              });
            },
            { threshold: 0.1 }
          );

          loadObserver.observe(pcLoad);
        }
      }
    }
  }

  /* ============================================================
     5. REVEAL AL HACER SCROLL
     ------------------------------------------------------------
     Añade .is-in cuando un elemento entra en pantalla.
     ============================================================ */
  const revealTargets = doc.querySelectorAll('.reveal, .mask');

  if (revealTargets.length) {
    if (!prefersReduced.matches && 'IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-in');
              revealObserver.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.18,
          rootMargin: '0px 0px -8% 0px'
        }
      );

      revealTargets.forEach(function (el) {
        revealObserver.observe(el);
      });
    } else {
      // Si no hay observer o se reduce movimiento, mostramos todo
      revealTargets.forEach(function (el) {
        el.classList.add('is-in');
      });
    }
  }

  /* ============================================================
     6. TEXTO SCRAMBLE
     ------------------------------------------------------------
     Efecto de texto aleatorio que se resuelve.
     ============================================================ */
  function runScramble(el) {
    // Guardamos el texto original la primera vez
    const original = el.dataset.text || el.textContent.trim();
    el.dataset.text = original;

    // Si reduce-motion, no animamos
    if (prefersReduced.matches) {
      el.textContent = original;
      return;
    }

    const glyphs =
      'ABCDEFGHIJKLMNÑOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&/<>=+*·';

    // Separamos por caracteres reales, respetando acentos
    const chars = Array.from(original);

    /*
       Cada carácter tiene:
       - start: cuándo empieza a resolverse
       - end: cuándo queda definitivo
       - rnd: carácter aleatorio actual
    */
    const queue = chars.map(function (to, i) {
      return {
        to: to,
        start: Math.floor(Math.random() * 8),
        end: Math.floor(Math.random() * 10) + 8 + i
      };
    });

    let frame = 0;

    function update() {
      let out = '';
      let done = 0;

      queue.forEach(function (q) {
        // Los espacios se mantienen
        if (q.to === ' ') {
          out += ' ';
          done++;
          return;
        }

        // Si ya terminó, mostramos el carácter real
        if (frame >= q.end) {
          out += q.to;
          done++;
        } else {
          // Si no, mostramos un carácter aleatorio
          if (!q.rnd || Math.random() < 0.35) {
            q.rnd = glyphs[Math.floor(Math.random() * glyphs.length)];
          }

          out += q.rnd;
        }
      });

      el.textContent = out;
      frame++;

      // Seguimos animando hasta completar todos los caracteres
      if (done < queue.length) {
        requestAnimationFrame(update);
      } else {
        el.textContent = original;
      }
    }

    update();
  }

  // Buscamos elementos con data-scramble
  const scrambleTargets = doc.querySelectorAll('[data-scramble]');

  if (scrambleTargets.length && !prefersReduced.matches) {
    if ('IntersectionObserver' in window) {
      const scrambleObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              runScramble(entry.target);
              scrambleObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );

      scrambleTargets.forEach(function (el) {
        scrambleObserver.observe(el);
      });
    } else {
      scrambleTargets.forEach(runScramble);
    }
  }

  /* ============================================================
     7. CONTADORES Y BARRAS DE ESTADÍSTICAS
     ------------------------------------------------------------
     Anima los números y rellena las barras al entrar en pantalla.
     ============================================================ */
  function animateCount(el) {
    const target = Number(el.dataset.count || 0);

    if (prefersReduced.matches) {
      el.textContent = target;
      return;
    }

    const duration = 1200;
    const start = performance.now();

    function frame(now) {
      const progress = Math.min(1, (now - start) / duration);

      // Easing suave: sale rápido y termina despacio
      const eased = 1 - Math.pow(1 - progress, 3);

      el.textContent = Math.round(target * eased);

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    }

    requestAnimationFrame(frame);
  }

  const stats = doc.querySelectorAll('.stat');

  if (stats.length) {
    if (!prefersReduced.matches && 'IntersectionObserver' in window) {
      const statObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              const stat = entry.target;
              const bar = stat.querySelector('.stat-bar');
              const num = stat.querySelector('.stat-num');

              // Rellenamos la barra
              if (bar) {
                bar.classList.add('is-filled');
              }

              // Contamos el número
              if (num) {
                animateCount(num);
              }

              statObserver.unobserve(stat);
            }
          });
        },
        { threshold: 0.4 }
      );

      stats.forEach(function (stat) {
        statObserver.observe(stat);
      });
    } else {
      // Fallback / reduce-motion: dejar valores finales
      stats.forEach(function (stat) {
        const bar = stat.querySelector('.stat-bar');
        const num = stat.querySelector('.stat-num');

        if (bar) {
          bar.classList.add('is-filled');
        }

        if (num) {
          num.textContent = num.dataset.count || '0';
        }
      });
    }
  }

  /* ============================================================
     8. NAVEGACIÓN ACTIVA SEGÚN SCROLL
     ------------------------------------------------------------
     Marca el enlace del menú correspondiente a la sección visible.
     ============================================================ */
  const navLinks = Array.from(doc.querySelectorAll('.nav a[href^="#"]'));
  const sectionMap = new Map();

  // Relacionamos enlace -> sección
  navLinks.forEach(function (link) {
    const id = link.getAttribute('href');

    if (!id || id === '#') return;

    const section = doc.querySelector(id);

    if (section) {
      sectionMap.set(section, link);
    }
  });

  if (sectionMap.size && 'IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const link = sectionMap.get(entry.target);

            if (link) {
              navLinks.forEach(function (l) {
                l.classList.remove('is-active');
              });

              link.classList.add('is-active');
            }
          }
        });
      },
      { threshold: 0.25 }
    );

    sectionMap.forEach(function (link, section) {
      navObserver.observe(section);
    });
  }

  /* ============================================================
     9. FORMULARIO DE CONTACTO
     ------------------------------------------------------------
     Abre el cliente de correo con mailto.
     No envía datos a ningún servidor.
     ============================================================ */
  const form = doc.getElementById('contact-form');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const data = new FormData(form);

      const nombre = (data.get('nombre') || '').toString().trim();
      const email = (data.get('email') || '').toString().trim();
      const mensaje = (data.get('mensaje') || '').toString().trim();

      const status = form.querySelector('.f-status');

      // Validación básica
      if (!nombre || !email || !mensaje) {
        if (status) {
          status.textContent = 'Rellena todos los campos.';
        }

        showToast('Faltan campos por rellenar');
        return;
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(email)) {
        if (status) {
          status.textContent = 'El correo no parece válido.';
        }

        showToast('Correo no válido');
        return;
      }

      // Construimos el mailto
      const subject = encodeURIComponent('Web personal — ' + nombre);
      const body = encodeURIComponent(
        'Nombre: ' + nombre + '\n' +
        'Correo: ' + email + '\n\n' +
        mensaje
      );

      window.location.href = 'mailto:hola@ivangomez.dev?subject=' + subject + '&body=' + body;

      if (status) {
        status.textContent = 'Abriendo tu cliente de correo…';
      }

      showToast('Mensaje preparado');
    });
  }

  /* ============================================================
     10. COPIAR CORREO
     ------------------------------------------------------------
     Copia el correo al portapapeles.
     ============================================================ */
  const copyButton = doc.getElementById('copy-mail');

  if (copyButton) {
    copyButton.addEventListener('click', async function () {
      const mail = copyButton.dataset.mail || 'hola@ivangomez.dev';
      let copied = false;

      // Intento moderno
      try {
        await navigator.clipboard.writeText(mail);
        copied = true;
      } catch (e) {
        copied = false;
      }

      // Fallback para navegadores antiguos o contextos restringidos
      if (!copied) {
        const textarea = doc.createElement('textarea');
        textarea.value = mail;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        doc.body.appendChild(textarea);
        textarea.select();

        try {
          copied = doc.execCommand('copy');
        } catch (e) {
          copied = false;
        }

        textarea.remove();
      }

      showToast(copied ? 'Correo copiado' : 'No se pudo copiar el correo');
    });
  }

  /* ============================================================
     11. AÑO AUTOMÁTICO EN EL FOOTER
     ============================================================ */
  const year = doc.getElementById('year');

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  /* ============================================================
     MARQUESINA: bucle infinito SIN huecos en cualquier pantalla
     ------------------------------------------------------------
     La animación CSS desplaza el track -50% (un grupo). Para que
     nunca se vea el corte, cada grupo debe medir al menos lo que
     mide la ventana. Aquí duplicamos .ticker-seq dentro de cada
     .ticker-group hasta cubrir el ancho visible. Solo AÑADIMOS
     clones (nunca limpiamos), así la animación no se reinicia.
     ============================================================ */
  (function () {
    const track = doc.querySelector('.ticker-track');
    if (!track) return;

    const groups = Array.from(track.querySelectorAll('.ticker-group'));
    if (!groups.length) return;

    // Ancho de una secuencia base (siempre medimos la primera)
    function seqWidth() {
      const seq = groups[0].querySelector('.ticker-seq');
      return seq ? seq.getBoundingClientRect().width : 0;
    }

    // Clona secuencias hasta que cada grupo cubra la ventana
    function fitTicker() {
      const viewport = track.parentElement.clientWidth; // ancho de .ticker
      const w = seqWidth();
      if (!w) return;

      // +1 de margen por redondeos y subpíxeles
      const need = Math.max(1, Math.ceil(viewport / w) + 1);

      groups.forEach(function (g) {
        const seqs = g.querySelectorAll('.ticker-seq');
        const tpl = seqs[0];
        for (let i = seqs.length; i < need; i++) {
          g.appendChild(tpl.cloneNode(true));
        }
        // Si ya hay de sobra, no quitamos: sobrar no rompe el bucle.
      });
    }

    // Primera pasada
    fitTicker();

    // Repetimos cuando las fuentes terminen de cargar (el ancho puede cambiar)
    if (doc.fonts && doc.fonts.ready) {
      doc.fonts.ready.then(fitTicker);
    } else {
      window.addEventListener('load', fitTicker);
    }

    // Reajustamos al cambiar el tamaño de la ventana (sin saltos)
    let rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(fitTicker, 150);
    });
  })();

})();