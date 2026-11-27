(function () {
  'use strict';
  var DATA = window.FLAX_MENU || [];

  /* ---------- shared: nav, order modal, reveal ---------- */
  var head = document.querySelector('.site-head');
  var burger = document.querySelector('.burger');
  var links = document.querySelector('.links');
  if (burger) burger.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    burger.textContent = open ? '✕' : '☰';
  });
  window.addEventListener('scroll', function () {
    if (head) head.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  var modal = document.getElementById('order-modal');
  function closeModal() { if (modal) modal.hidden = true; }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  document.addEventListener('click', function (e) {
    if (e.target.closest('.order-open')) { modal.hidden = false; modal.querySelector('.sw').focus(); return; }
    if (e.target.closest('.modal-x') || e.target === modal) { closeModal(); return; }
    var d = e.target.closest('.desc');
    if (d) d.classList.toggle('open');
  });

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.12 }) : null;
  function watch(root) {
    (root || document).querySelectorAll('.reveal:not(.in)').forEach(function (el) {
      if (io) io.observe(el); else el.classList.add('in');
    });
  }
  watch();

  /* ---------- card builder ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function parse(name) {
    var m = name.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
    var t = (m ? m[1] : name).replace(/\s*\|\s*/g, ' ');
    var tags = m ? m[2].split(',').map(function (x) { return x.trim(); }).filter(Boolean) : [];
    return { t: t, tags: tags };
  }
  function card(it) {
    var p = parse(it[0]), veg = it[2] === 'v';
    var pic = it[4]
      ? '<img src="images/' + it[4] + '" alt="' + esc(p.t) + '" loading="lazy">'
      : '<div class="ph" aria-hidden="true">' + (veg ? '🥗' : '🍗') + '</div>';
    return '<article class="card reveal"><div class="pic">' + pic +
      (it[6] ? '<span class="badge">Bestseller</span>' : '') +
      (it[5] ? '<span class="rate"><i>★</i> ' + it[5].toFixed(1) + '</span>' : '') +
      '</div><div class="body"><h3><span class="vi ' + (veg ? 'v' : 'n') + '" title="' + (veg ? 'Veg' : 'Non-veg') + '"></span>' + esc(p.t) + '</h3>' +
      (p.tags.length ? '<div class="tags">' + p.tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
      '<p class="desc" title="Tap to read more">' + esc(it[3]) + '</p>' +
      '<div class="foot"><span class="price">₹' + it[1] + '</span><button class="btn sm order-open" type="button">Order</button></div></div></article>';
  }

  /* ---------- home: bestsellers ---------- */
  var best = document.getElementById('best-root');
  if (best) {
    var picks = [];
    DATA.forEach(function (c) { c.i.forEach(function (it) { if (it[4] && it[5] >= 4.4) picks.push(it); }); });
    picks.sort(function (a, b) { return b[6] - a[6] || b[5] - a[5]; });
    best.innerHTML = picks.slice(0, 6).map(card).join('');
    watch(best);
  }

  /* ---------- menu page ---------- */
  var root = document.getElementById('menu-root');
  if (root) {
    var state = { cat: 0, diet: 'all', q: '' };
    var chips = document.getElementById('chips');
    var hash = decodeURIComponent(location.hash.slice(1));
    DATA.forEach(function (c, i) { if (c.c.toLowerCase().replace(/[^a-z]+/g, '-') === hash) state.cat = i; });

    function match(it) {
      if (state.diet !== 'all' && it[2] !== state.diet) return false;
      if (state.q) return (it[0] + ' ' + it[3]).toLowerCase().indexOf(state.q) > -1;
      return true;
    }
    function render() {
      chips.innerHTML = DATA.map(function (c, i) {
        var n = c.i.filter(match).length;
        return '<button type="button" data-i="' + i + '" class="' + (!state.q && i === state.cat ? 'on' : '') + '"' + (n ? '' : ' disabled style="opacity:.4"') + '>' + esc(c.c) + '<small>' + n + '</small></button>';
      }).join('');
      var html;
      if (state.q) {
        var all = [];
        DATA.forEach(function (c) { c.i.forEach(function (it) { if (match(it)) all.push(it); }); });
        html = '<div class="cat-title"><h2>Results for “' + esc(state.q) + '”</h2><span>' + all.length + ' dishes</span></div>' +
          (all.length ? '<div class="mgrid">' + all.map(card).join('') + '</div>' : '<p class="empty">No dish found. Try another word.</p>');
      } else {
        var c = DATA[state.cat], items = c.i.filter(match);
        html = '<div class="cat-title"><h2>' + esc(c.c) + '</h2><span>' + items.length + ' dishes</span></div>' +
          (items.length ? '<div class="mgrid">' + items.map(card).join('') + '</div>' : '<p class="empty">Nothing here for this filter.</p>');
      }
      root.innerHTML = html;
      watch(root);
    }
    chips.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      state.cat = +b.dataset.i; state.q = '';
      document.getElementById('q').value = '';
      history.replaceState(null, '', '#' + DATA[state.cat].c.toLowerCase().replace(/[^a-z]+/g, '-'));
      render();
      b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      window.scrollTo({ top: document.querySelector('.menu-tools').offsetTop - 74, behavior: 'smooth' });
    });
    document.querySelectorAll('.toggle button').forEach(function (b) {
      b.addEventListener('click', function () {
        state.diet = b.dataset.f;
        document.querySelectorAll('.toggle button').forEach(function (x) { x.classList.toggle('on', x === b); });
        render();
      });
    });
    document.getElementById('q').addEventListener('input', function (e) {
      state.q = e.target.value.trim().toLowerCase(); render();
    });
    render();
  }

  /* ---------- forms ---------- */
  var sub = document.getElementById('subscribe');
  if (sub) sub.addEventListener('click', function () {
    var v = document.getElementById('email').value.trim();
    document.getElementById('msg').textContent = /^\S+@\S+\.\S+$/.test(v)
      ? 'Thanks! Your free trial details are on the way.' : 'Please enter a valid email address.';
  });
  var form = document.getElementById('contact-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    document.getElementById('form-msg').textContent = 'Thanks! We will get back to you soon.';
    form.reset();
  });
})();
