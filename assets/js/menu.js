// Menú del encabezado en móvil: abre y cierra la navegación a pantalla completa.
document.addEventListener('DOMContentLoaded', function () {
  var boton = document.querySelector('.encabezado__menu-boton');
  var menu = document.getElementById('menu-principal');
  if (!boton || !menu) return;

  function cambiar(abrir) {
    document.body.classList.toggle('menu-abierto', abrir);
    boton.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    boton.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
  }

  boton.addEventListener('click', function () {
    cambiar(boton.getAttribute('aria-expanded') !== 'true');
  });

  // Al elegir un enlace, el menú se cierra
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) cambiar(false);
  });

  // La tecla Escape también lo cierra
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && boton.getAttribute('aria-expanded') === 'true') {
      cambiar(false);
      boton.focus();
    }
  });
});

// Índice lateral (proyectos y módulos de Plataforma BI): marca la sección que se está viendo.
// Se calcula según la posición de cada sección en pantalla, al hacer scroll y al usar el índice.
(function () {
  var bloqueado = false, temporizador = null;

  function enlacesVisibles() {
    return Array.prototype.slice.call(document.querySelectorAll('.pbi-indice__enlace'))
      .filter(function (a) { return a.offsetParent !== null; });
  }

  function marcar(enlaces, activo) {
    enlaces.forEach(function (a) {
      if (a === activo) {
        if (a.getAttribute('aria-current')) return;
        a.setAttribute('aria-current', 'location');
        // En pantallas chicas el índice es una fila deslizable: mantener visible el activo
        var fila = a.closest('.pbi-indice__lista');
        if (fila && fila.scrollWidth > fila.clientWidth) {
          fila.scrollTo({ left: a.offsetLeft - 16, behavior: 'smooth' });
        }
      } else {
        a.removeAttribute('aria-current');
      }
    });
  }

  function actualizar() {
    if (bloqueado) return;
    var enlaces = enlacesVisibles();
    if (!enlaces.length) return;
    var limite = window.innerHeight * 0.3;
    var activo = enlaces[0];
    var alFinal = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    enlaces.forEach(function (a) {
      var s = document.getElementById(a.getAttribute('href').slice(1));
      if (s && s.getBoundingClientRect().top <= limite) activo = a;
    });
    if (alFinal) {
      // Si la última sección es corta y ya se ve, se marca al llegar al final
      var ultimo = enlaces[enlaces.length - 1];
      var su = document.getElementById(ultimo.getAttribute('href').slice(1));
      if (su && su.getBoundingClientRect().top < window.innerHeight) activo = ultimo;
    }
    marcar(enlaces, activo);
  }

  var pendiente = false;
  window.addEventListener('scroll', function () {
    if (bloqueado) {
      // Tras un clic en el índice, esperar a que termine el desplazamiento
      clearTimeout(temporizador);
      temporizador = setTimeout(function () { bloqueado = false; }, 200);
      return;
    }
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(function () { pendiente = false; actualizar(); });
  }, { passive: true });
  window.addEventListener('resize', actualizar);

  document.addEventListener('click', function (e) {
    var a = e.target.closest('.pbi-indice__enlace');
    if (a) {
      marcar(enlacesVisibles(), a);
      bloqueado = true;
      clearTimeout(temporizador);
      temporizador = setTimeout(function () { bloqueado = false; }, 1200);
    } else if (e.target.closest('[role="tab"], a[href^="#"]')) {
      // Cambio de pestaña u otro enlace interno: recalcular cuando se muestre el contenido
      setTimeout(actualizar, 60);
    }
  });

  document.addEventListener('DOMContentLoaded', function () { setTimeout(actualizar, 100); });
  window.addEventListener('popstate', function () { setTimeout(actualizar, 100); });
  document.addEventListener('keyup', function (e) {
    if (e.target.closest && e.target.closest('[role="tablist"]')) setTimeout(actualizar, 60);
  });
})();

// Imágenes con etiquetas interactivas (por ejemplo, la anatomía del Reporte Estratégico):
// al pasar el cursor, enfocar o tocar una etiqueta se resalta el texto que la explica, y viceversa.
(function () {
  var fijado = null;

  function elementos(clave) {
    return document.querySelectorAll('[data-anatomia="' + clave + '"], [data-anatomia-texto="' + clave + '"]');
  }
  function resaltar(clave, activo) {
    Array.prototype.forEach.call(elementos(clave), function (el) {
      el.classList.toggle('anatomia-activo', activo);
      // La tabla está bajo el gráfico: la imagen se desplaza hacia abajo para mostrarla
      if (clave === 'tabla' && el.matches('[data-anatomia]')) {
        var marco = el.closest('.anatomia');
        if (marco) marco.classList.toggle('anatomia--tabla', activo);
      }
    });
  }
  function claveDe(el) {
    var x = el && el.closest && el.closest('[data-anatomia], [data-anatomia-texto]');
    return x ? (x.getAttribute('data-anatomia') || x.getAttribute('data-anatomia-texto')) : null;
  }

  ['mouseover', 'focusin'].forEach(function (tipo) {
    document.addEventListener(tipo, function (e) {
      var k = claveDe(e.target);
      if (k) resaltar(k, true);
    });
  });
  ['mouseout', 'focusout'].forEach(function (tipo) {
    document.addEventListener(tipo, function (e) {
      var k = claveDe(e.target);
      if (!k || k === fijado) return;
      var hacia = claveDe(e.relatedTarget);
      if (hacia !== k) resaltar(k, false);
    });
  });
  // Toque o clic: deja el resaltado fijo hasta tocar otra cosa
  document.addEventListener('click', function (e) {
    var k = claveDe(e.target);
    if (fijado && fijado !== k) resaltar(fijado, false);
    fijado = (k && k !== fijado) ? k : null;
    if (k) resaltar(k, fijado === k);
  });
})();

// Ampliar imágenes al hacer clic: se abren a pantalla completa y se cierran con la X, con Esc o tocando afuera.
// No aplica a imágenes que ya son enlaces (por ejemplo, las tarjetas del Home).
(function () {
  var visor = null, imagenVisor = null, videoVisor = null, cerrar = null, origen = null;

  function ampliables() {
    return Array.prototype.slice.call(document.querySelectorAll('main img, main .video-demo video')).filter(function (img) {
      return !img.closest('a, button, .no-ampliar, .comparar');
    });
  }

  function crearVisor() {
    visor = document.createElement('div');
    visor.className = 'visor';
    visor.setAttribute('role', 'dialog');
    visor.setAttribute('aria-modal', 'true');
    visor.setAttribute('aria-label', 'Imagen ampliada');
    visor.hidden = true;
    visor.innerHTML = '<button type="button" class="visor__cerrar" aria-label="Cerrar imagen ampliada">' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      '</button><img class="visor__imagen" alt=""><video class="visor__video" muted loop playsinline></video>';
    document.body.appendChild(visor);
    imagenVisor = visor.querySelector('.visor__imagen');
    videoVisor = visor.querySelector('.visor__video');
    cerrar = visor.querySelector('.visor__cerrar');
    cerrar.addEventListener('click', ocultar);
    visor.addEventListener('click', function (e) { if (e.target === visor) ocultar(); });
    visor.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); ocultar(); }
      if (e.key === 'Tab') { e.preventDefault(); cerrar.focus(); } // el foco se queda en el visor
    });
  }

  function mostrar(img) {
    if (!visor) crearVisor();
    origen = img;
    var esVideo = img.tagName === 'VIDEO';
    imagenVisor.hidden = esVideo; videoVisor.hidden = !esVideo;
    if (esVideo) {
      videoVisor.src = img.currentSrc || img.src;
      videoVisor.setAttribute('aria-label', img.dataset.descripcion || '');
      videoVisor.currentTime = img.currentTime || 0;
      var p = videoVisor.play(); if (p && p.catch) p.catch(function () {});
    } else {
      imagenVisor.src = img.currentSrc || img.src;
      imagenVisor.alt = img.alt || '';
    }
    visor.hidden = false;
    document.body.classList.add('visor-abierto');
    cerrar.focus();
  }

  function ocultar() {
    visor.hidden = true;
    imagenVisor.removeAttribute('src');
    videoVisor.pause(); videoVisor.removeAttribute('src');
    document.body.classList.remove('visor-abierto');
    if (origen) origen.focus();
  }

  document.addEventListener('DOMContentLoaded', function () {
    ampliables().forEach(function (img) {
      img.classList.add('ampliable');
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-haspopup', 'dialog');
      var desc = img.alt || img.getAttribute('aria-label') || '';
      img.setAttribute('aria-label', (img.tagName === 'VIDEO' ? 'Ampliar animación' : 'Ampliar imagen') + (desc ? ': ' + desc : ''));
      if (img.tagName === 'VIDEO') img.dataset.descripcion = desc;
      img.addEventListener('click', function () { mostrar(img); });
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); mostrar(img); }
      });
    });
  });
})();

// Interruptor Antes / Después: una sola visual grande y dos botones para cambiar entre ambas.
document.addEventListener('click', function (e) {
  var boton = e.target.closest('.alternar__boton');
  if (!boton) return;
  var grupo = boton.closest('.alternar');
  var vista = boton.getAttribute('data-vista');
  grupo.querySelectorAll('.alternar__boton').forEach(function (b) {
    b.setAttribute('aria-pressed', b === boton ? 'true' : 'false');
  });
  grupo.querySelectorAll('.alternar__vista').forEach(function (v) {
    v.hidden = v.getAttribute('data-vista') !== vista;
  });
});

// Videos de demostración (reemplazan a los GIF): se reproducen solos, en bucle y sin sonido,
// solo mientras están a la vista; tienen botón de pausa y respetan "reducir movimiento".
(function () {
  var reducir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function estado(caja, enPausa) {
    caja.classList.toggle('video-demo--pausa', enPausa);
    var b = caja.querySelector('.video-demo__pausa');
    if (b) b.setAttribute('aria-label', enPausa ? 'Reproducir animación' : 'Pausar animación');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var cajas = Array.prototype.slice.call(document.querySelectorAll('.video-demo'));
    cajas.forEach(function (caja) {
      var v = caja.querySelector('video');
      v.muted = true;
      v.removeAttribute('autoplay');
      v.pause();
      // Con "reducir movimiento" queda en el cuadro fijo hasta que la persona presione reproducir
      caja.dataset.pausaManual = reducir ? '1' : '';
      estado(caja, true);
      caja.querySelector('.video-demo__pausa').addEventListener('click', function (e) {
        e.stopPropagation();
        if (v.paused) { caja.dataset.pausaManual = ''; v.play(); estado(caja, false); }
        else { caja.dataset.pausaManual = '1'; v.pause(); estado(caja, true); }
      });
    });
    if (!('IntersectionObserver' in window)) return;
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        var caja = en.target, v = caja.querySelector('video');
        if (en.isIntersecting && !caja.dataset.pausaManual) {
          var p = v.play(); if (p && p.catch) p.catch(function () {});
          estado(caja, false);
        } else if (!en.isIntersecting && !v.paused) {
          v.pause(); estado(caja, true);
        }
      });
    }, { threshold: 0.35 });
    cajas.forEach(function (c) { obs.observe(c); });
  });
})();

// Prototipos incrustados: se muestran en su tamaño de escritorio (1440 × 900) reducidos al ancho
// disponible, para que se vean igual que en pantalla completa. En celular se muestra una imagen.
(function () {
  function ajustar() {
    document.querySelectorAll('.proto-marco').forEach(function (marco) {
      var f = marco.querySelector('iframe');
      if (!f) return;
      var ancho = +marco.getAttribute('data-ancho') || 1440;
      var alto = +marco.getAttribute('data-alto') || 900;
      var escala = marco.clientWidth / ancho;
      f.style.width = ancho + 'px';
      f.style.height = alto + 'px';
      f.style.transform = 'scale(' + escala + ')';
      f.style.transformOrigin = '0 0';
    });
  }
  document.addEventListener('DOMContentLoaded', ajustar);
  window.addEventListener('resize', ajustar);
  // al cambiar de pestaña el marco pasa de oculto a visible
  document.addEventListener('click', function () { setTimeout(ajustar, 80); });
})();

// Comparador con deslizador: mueve la línea que separa la versión anterior (izquierda) de la nueva (derecha).
document.addEventListener('input', function (e) {
  if (!e.target.classList || !e.target.classList.contains('comparar__control')) return;
  var caja = e.target.closest('.comparar');
  caja.style.setProperty('--pos', e.target.value + '%');
  e.target.setAttribute('aria-valuetext', e.target.value + '% versión migrada');
});
