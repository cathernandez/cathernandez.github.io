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
