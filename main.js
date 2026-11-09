// Javier Marañón · interacción ligera, sin librerías
(() => {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // cabecera con sombra al bajar
  const cab = $('[data-cab]');
  const sombra = () => cab.classList.toggle('cab--sombra', scrollY > 8);

  // ---------- el cuadro de servicios ----------
  const tablero = $('[data-tablero]'), iga = $('[data-iga]'), mods = $$('[data-mod]'), paneles = $$('[data-panel]'), caja = $('.paneles');
  let tension = false, sel = 0, tiempos = [];
  const elegir = (k) => {
    sel = k;
    mods.forEach((m, i) => m.setAttribute('aria-pressed', String(i === k)));
    paneles.forEach((p, i) => { p.hidden = i !== k; });
  };
  const encender = (on, rapido) => {
    tiempos.forEach(clearTimeout); tiempos = [];
    tension = on;
    iga.setAttribute('aria-pressed', String(on));
    iga.classList.toggle('mod--on', on);
    tablero.classList.toggle('tablero--on', on);
    caja.classList.toggle('paneles--sin', !on);
    mods.forEach((m, i) => {
      if (!on || rapido || quieto) m.classList.toggle('mod--on', on);
      else tiempos.push(setTimeout(() => m.classList.add('mod--on'), 220 + i * 85));
    });
  };
  iga.addEventListener('click', () => encender(!tension));
  mods.forEach((m, i) => m.addEventListener('click', () => { if (!tension) encender(true, true); elegir(i); }));
  // flechas para moverse entre interruptores
  $('.tablero__carril').addEventListener('keydown', (e) => {
    const todos = [iga, ...mods], i = todos.indexOf(document.activeElement);
    if (i < 0 || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const j = (i + (e.key === 'ArrowRight' ? 1 : -1) + todos.length) % todos.length;
    todos[j].focus();
  });
  caja.classList.add('paneles--sin');
  // las fotos de los demás servicios se piden al acercarse, para que el cambio sea instantáneo
  new IntersectionObserver((ent, obs) => {
    if (ent[0].isIntersecting) { $$('.panel img', caja).forEach((i) => { i.loading = 'eager'; }); obs.disconnect(); }
  }, { rootMargin: '500px 0px' }).observe(tablero);
  new IntersectionObserver((ent, obs) => {
    if (ent[0].isIntersecting) { encender(true); obs.disconnect(); }
  }, { threshold: .45 }).observe(tablero);

  // ---------- el plano: los circuitos se dibujan al verse ----------
  const plano = $('[data-plano]');
  new IntersectionObserver((ent, obs) => {
    if (ent[0].isIntersecting) { plano.classList.add('plano--on'); obs.disconnect(); }
  }, { threshold: .35 }).observe(plano);

  // ---------- el yeso se retira al bajar, y el cable se llena ----------
  const pared = $('[data-yeso]'), cable = $('[data-cable]'), hitos = $$('.cable__hito');
  const lim = (v) => Math.max(0, Math.min(1, v));
  let pend = false;
  const pinta = () => {
    pend = false;
    const vh = innerHeight;
    if (pared && !quieto) {
      // en escritorio la foto se queda fija mientras baja el texto: el yeso se retira en ese tramo
      let p;
      if (getComputedStyle(pared).position === 'sticky') {
        const g = pared.parentElement.getBoundingClientRect();
        p = (vh * .35 - g.top) / Math.max(1, g.height - vh * .45);
      } else {
        const r = pared.getBoundingClientRect();
        p = (vh * .72 - r.top) / (r.height * .85);
      }
      pared.style.setProperty('--p', lim(p).toFixed(3));
    }
    if (cable) {
      const r = cable.getBoundingClientRect();
      const p = lim((vh * .62 - r.top) / r.height);
      cable.style.setProperty('--p', p.toFixed(3));
      hitos.forEach((h) => h.classList.toggle('on', h.getBoundingClientRect().top + 12 < vh * .62));
    }
    sombra();
  };
  const alBajar = () => { if (!pend) { pend = true; requestAnimationFrame(pinta); } };
  addEventListener('scroll', alBajar, { passive: true });
  addEventListener('resize', alBajar);
  pinta();

  // ---------- formulario → WhatsApp o correo con el mensaje escrito ----------
  const form = $('[data-form]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(form), tipo = d.get('tipo'), lugar = (d.get('lugar') || '').trim(), msg = (d.get('msg') || '').trim();
    const lineas = ['Hola, Javier. Te escribo desde tu web.'];
    lineas.push(tipo ? `Necesito: ${tipo}.` : 'Quiero pedir presupuesto.');
    if (lugar) lineas.push(`Municipio: ${lugar}.`);
    if (msg) lineas.push(msg);
    const texto = lineas.join('\n');
    const via = e.submitter && e.submitter.value;
    if (via === 'mail') location.href = `mailto:${window.CONTACTO.email}?subject=${encodeURIComponent('Presupuesto' + (tipo ? ': ' + tipo : ''))}&body=${encodeURIComponent(texto)}`;
    else window.open(`${window.CONTACTO.wa}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  });
})();
