// Pestañas de módulos (Plataforma BI).
// - Cada pestaña tiene su propia dirección: /proyectos/plataforma-bi.html#flujos
// - Cualquier enlace a un módulo (o a una sección dentro de él) abre la pestaña correcta.
// - Flechas izquierda/derecha, Inicio y Fin para moverse entre pestañas con el teclado.
// - El índice lateral marca la sección que se está leyendo.
document.addEventListener('DOMContentLoaded', function () {
  var lista = document.querySelector('[role="tablist"]');
  if (!lista) return;
  var pestanas = Array.prototype.slice.call(lista.querySelectorAll('[role="tab"]'));
  var paneles = pestanas.map(function (p) { return document.getElementById(p.getAttribute('aria-controls')); });
  var modulos = document.getElementById('modulos');

  function activar(i, enfocar) {
    pestanas.forEach(function (p, j) {
      var activa = i === j;
      p.setAttribute('aria-selected', activa ? 'true' : 'false');
      p.setAttribute('tabindex', activa ? '0' : '-1');
      paneles[j].hidden = !activa;
    });
    if (enfocar) pestanas[i].focus();
    observarIndice(paneles[i]);
  }

  // Busca a qué panel pertenece un id (el panel mismo o algo dentro de él)
  function panelDe(id) {
    if (!id) return -1;
    var el = document.getElementById(id);
    if (!el) return -1;
    for (var i = 0; i < paneles.length; i++) {
      if (paneles[i] === el || paneles[i].contains(el)) return i;
    }
    return -1;
  }

  function irA(id, actualizarDireccion) {
    var i = panelDe(id);
    if (i < 0) return false;
    activar(i, false);
    var destino = document.getElementById(id);
    var esPanel = destino === paneles[i];
    // Al abrir un módulo se sube al inicio de las pestañas; a una sección, directo a ella
    (esPanel ? lista : destino).scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (actualizarDireccion) history.pushState(null, '', '#' + id);
    return true;
  }

  // Clics en enlaces internos de la página
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (panelDe(id) >= 0) {
      e.preventDefault();
      irA(id, true);
    }
  });

  // Teclado en la barra de pestañas
  lista.addEventListener('keydown', function (e) {
    var i = pestanas.indexOf(document.activeElement);
    if (i < 0) return;
    var nuevo = null;
    if (e.key === 'ArrowRight') nuevo = (i + 1) % pestanas.length;
    if (e.key === 'ArrowLeft') nuevo = (i - 1 + pestanas.length) % pestanas.length;
    if (e.key === 'Home') nuevo = 0;
    if (e.key === 'End') nuevo = pestanas.length - 1;
    if (nuevo === null) return;
    e.preventDefault();
    activar(nuevo, true);
    history.replaceState(null, '', '#' + paneles[nuevo].id);
  });

  // Botones atrás/adelante del navegador
  window.addEventListener('popstate', function () {
    var id = location.hash.slice(1);
    if (!irA(id, false)) activar(0, false);
  });

  // Índice lateral: marca la sección visible
  var observador = null;
  function observarIndice(panel) {
    if (observador) observador.disconnect();
    if (!('IntersectionObserver' in window)) return;
    var enlaces = Array.prototype.slice.call(panel.querySelectorAll('.pbi-indice__enlace'));
    if (!enlaces.length) return;
    observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        enlaces.forEach(function (a) {
          if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'location');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    enlaces.forEach(function (a) {
      var s = document.getElementById(a.getAttribute('href').slice(1));
      if (s) observador.observe(s);
    });
  }

  // Al cargar: abre la pestaña de la dirección, si la hay
  var inicial = location.hash.slice(1);
  if (panelDe(inicial) >= 0) {
    activar(panelDe(inicial), false);
    setTimeout(function () { document.getElementById(inicial).scrollIntoView({ block: 'start' }); }, 50);
  } else {
    activar(0, false);
  }
});
