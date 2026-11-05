(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- storage (safe) ---------- */
  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
  }

  /* ---------- header: solid on scroll, hide on scroll down ---------- */
  var header = $('#header');
  var mbar = $('#mbar');
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY || 0;
    header.classList.toggle('is-solid', y > 40);
    if (!document.body.classList.contains('menu-open')) {
      header.classList.toggle('is-hidden', y > 500 && y > lastY + 4);
      if (y < lastY - 4) header.classList.remove('is-hidden');
    }
    if (mbar) mbar.classList.toggle('is-on', y > 500);
    lastY = y;
    thermo();
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- burger menu ---------- */
  var burger = $('#burger'), menu = $('#mmenu');
  function setMenu(open) {
    burger.classList.toggle('is-open', open);
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.setAttribute('aria-hidden', String(!open));
    header.classList.remove('is-hidden');
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMenu(false); closeLb(); } });
  window.addEventListener('resize', function () { if (window.innerWidth > 1080) setMenu(false); positionInk(); });

  /* ---------- reveal on scroll ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el, i) {
      var sib = el.parentElement ? $$(':scope > .reveal', el.parentElement).indexOf(el) : 0;
      el.style.transitionDelay = Math.min(sib, 6) * 70 + 'ms';
      io.observe(el);
    });
    // safety: never leave content hidden
    setTimeout(function () { reveals.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < window.innerHeight) el.classList.add('is-in'); }); }, 1800);
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- counters ---------- */
  $$('[data-count]').forEach(function (el) {
    if (reduce) return;
    var to = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var t0 = null, dur = 1600;
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = (to * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
    }
    setTimeout(function () { requestAnimationFrame(tick); }, 700);
  });

  /* ---------- hero parallax ---------- */
  var hv = $('#heroVisual');
  if (hv && finePointer && !reduce) {
    var blobs = $$('[data-depth]', hv);
    var hero = $('.hero');
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      blobs.forEach(function (b) {
        var d = parseFloat(b.getAttribute('data-depth'));
        b.style.transform = 'translate3d(' + (x * 22 * d) + 'px,' + (y * 22 * d) + 'px,0)';
      });
    });
    hero.addEventListener('mouseleave', function () { blobs.forEach(function (b) { b.style.transform = ''; }); });
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduce) {
    $$('.magnetic').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.transform = 'translate(' + x * 0.18 + 'px,' + y * 0.3 + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- kiln thermometer ---------- */
  var kiln = $('#process'), fill = $('#thermoFill'), val = $('#thermoVal'), steps = $$('.step');
  var temps = [20, 20, 900, 1220];
  function thermo() {
    if (!kiln) return;
    var r = kiln.getBoundingClientRect(), vh = window.innerHeight;
    var p = (vh * 0.85 - r.top) / (r.height * 0.85);
    p = Math.max(0, Math.min(1, p));
    fill.style.width = (p * 100).toFixed(1) + '%';
    var idx = Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999));
    var seg = p * (temps.length - 1);
    var i = Math.floor(seg), f = seg - i;
    var t = i >= temps.length - 1 ? temps[temps.length - 1] : temps[i] + (temps[i + 1] - temps[i]) * f;
    val.textContent = Math.round(t / 10) * 10;
    steps.forEach(function (s, k) { s.classList.toggle('is-hot', k <= idx && p > 0.02); });
  }

  /* ---------- tabs ---------- */
  var tabBtns = $$('.tabs__btn'), ink = $('.tabs__ink');
  function positionInk() {
    var a = $('.tabs__btn.is-active');
    if (!a || !ink) return;
    ink.style.width = a.offsetWidth + 'px';
    ink.style.transform = 'translateX(' + (a.offsetLeft - 5) + 'px)';
  }
  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabBtns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', String(on));
        var p = document.getElementById(b.getAttribute('aria-controls'));
        p.hidden = !on; p.classList.toggle('is-active', on);
      });
      positionInk();
    });
  });
  positionInk();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(positionInk);

  /* ---------- schedule ---------- */
  var SCHED = {
    wed: [
      { t: '16:30 – 18:00', n: 'Художественная керамика для детей', s: 'Группа 6–10 лет · набор открыт', p: 'по запросу' }
    ],
    thu: [
      { t: '17:00 – 18:30', n: 'Мастер-класс по керамике', s: 'Дети и взрослые · Светлана Морозова', p: '1 500 ₽' }
    ],
    fri: [
      { t: '14:00 – 17:00', n: 'Базовый курс по керамике', s: 'Взрослая группа · глазурная живопись, лепка', p: 'по запросу', tag: 'есть места' },
      { t: '17:00 – 20:00', n: 'Базовый курс по керамике', s: 'Вечерняя взрослая группа', p: 'по запросу', tag: 'есть места' },
      { t: '19:00', n: 'Киноклуб', s: 'Фильм и разбор со сценаристом и психологом', p: '700 ₽' }
    ],
    sat: [
      { t: '11:00 – 12:15', n: 'Детско-родительское занятие', s: 'Все возрасты · Наталья Вострякова', p: 'от 1 300 ₽' },
      { t: '13:30 – 15:00', n: 'Индивидуально: круг или лепка', s: 'Свидание за кругом — 5 500 ₽ на двоих', p: '3 500 ₽' },
      { t: '16:00 – 17:30', n: 'Свободная тема, семейная группа', s: 'Дети, подростки и взрослые · Майя Наумова', p: 'от 1 300 ₽' },
      { t: '18:00 – 19:30', n: 'Свободная тема, взрослая группа', s: 'Крупные проекты и глазури · Майя Наумова', p: '2 000 ₽' }
    ],
    sun: [
      { t: '18:30', n: 'Чайная церемония', s: 'От двух человек · Майя Наумова', p: '2 500 ₽' },
      { t: 'по договорённости', n: 'Мастер-классы Катрен', s: 'Кожа, скрабы, бомбочки, конфеты', p: 'от 1 000 ₽' }
    ]
  };
  var slots = $('#slots');
  function renderDay(d) {
    slots.innerHTML = SCHED[d].map(function (x) {
      return '<li class="slot"><span class="slot__time">' + x.t + '</span>' +
        '<div class="slot__name"><b>' + x.n + (x.tag ? '<span class="slot__tag">' + x.tag + '</span>' : '') + '</b><span>' + x.s + '</span></div>' +
        '<span class="slot__price">' + x.p + '</span></li>';
    }).join('');
  }
  $$('.days__btn').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.days__btn').forEach(function (o) { o.classList.toggle('is-active', o === b); o.setAttribute('aria-selected', String(o === b)); });
      renderDay(b.getAttribute('data-day'));
    });
  });
  renderDay('sat');

  /* ---------- light switch ---------- */
  var sw = $('#lightSwitch'), glass = $('#glass');
  if (sw) sw.addEventListener('click', function () {
    var on = sw.getAttribute('aria-pressed') !== 'true';
    sw.setAttribute('aria-pressed', String(on));
    glass.setAttribute('data-light', on ? 'on' : 'off');
    $('.switch__label', sw).textContent = on ? 'Свет включён' : 'Включить свет';
  });

  /* ---------- lightbox ---------- */
  var figs = $$('.g'), lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), cur = 0, lastFocus = null;
  function openLb(i) {
    cur = (i + figs.length) % figs.length;
    var f = figs[cur], img = $('img', f), cap = $('figcaption', f);
    lbImg.src = f.getAttribute('data-full'); lbImg.alt = img.alt;
    lbCap.textContent = cap ? cap.textContent : '';
    if (lb.hidden) lastFocus = document.activeElement;
    lb.hidden = false; document.body.style.overflow = 'hidden';
    $('#lbClose').focus();
  }
  function closeLb() {
    if (!lb || lb.hidden) return;
    lb.hidden = true; document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  figs.forEach(function (f, i) {
    f.tabIndex = 0; f.setAttribute('role', 'button');
    f.addEventListener('click', function () { openLb(i); });
    f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(i); } });
  });
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', function () { openLb(cur - 1); });
  $('#lbNext').addEventListener('click', function () { openLb(cur + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'ArrowLeft') openLb(cur - 1);
    if (e.key === 'ArrowRight') openLb(cur + 1);
  });
  var tx = 0;
  lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) openLb(cur + (dx < 0 ? 1 : -1));
  });

  /* ---------- prefill booking format ---------- */
  var sel = $('#f-format');
  $$('[data-pick]').forEach(function (a) {
    a.addEventListener('click', function () {
      var v = a.getAttribute('data-pick');
      $$('option', sel).forEach(function (o) { if (o.textContent === v) sel.value = v; });
    });
  });

  /* ---------- phone mask ---------- */
  var phone = $('#f-phone');
  phone.addEventListener('input', function () {
    var d = phone.value.replace(/\D/g, '');
    if (d.charAt(0) === '8') d = '7' + d.slice(1);
    if (d && d.charAt(0) !== '7') d = '7' + d;
    d = d.slice(0, 11);
    var o = '';
    if (d.length) o = '+7';
    if (d.length > 1) o += ' (' + d.slice(1, 4);
    if (d.length >= 4) o += ')';
    if (d.length > 4) o += ' ' + d.slice(4, 7);
    if (d.length > 7) o += '-' + d.slice(7, 9);
    if (d.length > 9) o += '-' + d.slice(9, 11);
    phone.value = o;
    phone.classList.remove('is-bad');
  });

  /* ---------- form ---------- */
  var form = $('#form'), err = $('#formError'), ok = $('#formOk');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#f-name'), agree = $('#f-agree');
    var digits = phone.value.replace(/\D/g, '');
    var msg = '';
    name.classList.toggle('is-bad', !name.value.trim());
    phone.classList.toggle('is-bad', digits.length < 11);
    if (!name.value.trim()) msg = 'Напишите, как к вам обращаться.';
    else if (digits.length < 11) msg = 'Проверьте номер телефона: нужно 11 цифр.';
    else if (!agree.checked) msg = 'Отметьте согласие на обработку данных — без него мы не сможем связаться.';
    if (msg) { err.textContent = msg; err.hidden = false; return; }
    err.hidden = true;
    $$('.field, .check, button[type=submit]', form).forEach(function (el) { el.hidden = true; });
    ok.hidden = false;
  });

  /* ---------- cookie ---------- */
  var cookie = $('#cookie');
  if (!store('vestus-cookie')) setTimeout(function () { cookie.hidden = false; }, 1200);
  function setCookie(v) { store('vestus-cookie', v); cookie.hidden = true; }
  $('#cookieOk').addEventListener('click', function () { setCookie('all'); });
  $('#cookieMin').addEventListener('click', function () { setCookie('necessary'); });

  onScroll();
})();
