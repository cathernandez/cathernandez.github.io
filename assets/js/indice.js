// Índice lateral de las páginas de proyecto: marca la sección que se está leyendo.
document.addEventListener('DOMContentLoaded', function () {
  var enlaces = Array.prototype.slice.call(document.querySelectorAll('.pbi-indice--caso .pbi-indice__enlace'));
  if (!enlaces.length || !('IntersectionObserver' in window)) return;
  var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (en) {
      if (!en.isIntersecting) return;
      enlaces.forEach(function (a) {
        var activo = a.getAttribute('href') === '#' + en.target.id;
        if (activo) {
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
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  enlaces.forEach(function (a) {
    var s = document.getElementById(a.getAttribute('href').slice(1));
    if (s) observador.observe(s);
  });
});
