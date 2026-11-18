(function () {
  var nav = document.querySelector('.entregables');
  var root = document.documentElement;
  if (!nav || !root.requestFullscreen) return;
  var b = document.createElement('button');
  b.type = 'button'; b.className = 'pantalla';
  var ico = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var entrar = ico + '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg><span>Pantalla completa</span>';
  var salir = ico + '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg><span>Salir</span>';
  function pintar() {
    var on = !!document.fullscreenElement;
    b.innerHTML = on ? salir : entrar;
    b.setAttribute('aria-label', on ? 'Salir de pantalla completa' : 'Pantalla completa');
  }
  b.addEventListener('click', function () {
    try { document.fullscreenElement ? document.exitFullscreen() : root.requestFullscreen(); } catch (e) {}
  });
  document.addEventListener('fullscreenchange', pintar);
  pintar();
  nav.insertAdjacentElement('afterend', b);
})();
