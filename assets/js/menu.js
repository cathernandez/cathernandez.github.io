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
