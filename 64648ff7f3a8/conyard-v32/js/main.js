/* =========================================================
   컨야드 랜딩 v3.0 - 동작 (하림지주 메인 동작 분석 반영)
   - 나타나기: 화면에 들어오면 .ani에 on (참고: 스크롤 위치 - 800px에서 on)
   - 첫 화면: 4장 서서히 바뀜, 글자는 위에서 아래로 걷히고 단추는 1초 뒤
   - 한 문장: 화면 가운데에 오면 꼬리표/단추가 나오고 강조 낱말이 차례로 주황으로 칠해짐, 벗어나면 처음으로
   - 하루 흐름: 화면 고정 + 스크롤만큼 과정 카드가 왼쪽으로 이동(ScrollTrigger pin, scrub)
   - 걱정 카드: 마우스를 올리면 넓어지고 글이 위로 올라가며 설명이 보임
   - 동그라미 단추: 마우스를 따라 0.4배만큼 끌려옴(자석)
   v1.1 동작(설명선, 탭, 질문 펼침, 핵심 장면 고정, 신청 칸 검사)은 그대로 쓴다.
   ========================================================= */
(function () {
  'use strict';

  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  var hasGsap = function () { return !!(window.gsap && window.ScrollTrigger); };
  function scrollToY(y) { window.scrollTo({ top: y, behavior: reduceMQ.matches ? 'auto' : 'smooth' }); }

  /* ---------- 나타나기 ---------- */
  function initAni() {
    var els = $$('.ani, .ttl .eng-text');
    if (reduceMQ.matches || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('on'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- 자석 단추 ---------- */
  function initMagnetic() {
    if (!window.matchMedia('(hover: hover)').matches) return;
    $$('.magnetic-item').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2, my = e.clientY - r.top - r.height / 2;
        el.style.transform = 'translate(' + (mx * 0.4).toFixed(1) + 'px,' + (my * 0.4).toFixed(1) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = 'translate3d(0,0,0)'; });
    });
  }

  /* ---------- 전체 메뉴 ---------- */
  function initSitemap() {
    var btn = $('.hd__menu'), map = $('#sitemap'), close = $('.sitemap__close');
    function open() { map.hidden = false; btn.setAttribute('aria-expanded', 'true'); document.documentElement.style.overflow = 'hidden'; var a = $('a', map); if (a) a.focus(); }
    function shut(back) { map.hidden = true; btn.setAttribute('aria-expanded', 'false'); document.documentElement.style.overflow = ''; if (back) btn.focus(); }
    btn.addEventListener('click', open);
    close.addEventListener('click', function () { shut(true); });
    $$('a', map).forEach(function (a) { a.addEventListener('click', function () { shut(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !map.hidden) shut(true); });
  }

  /* ---------- 1. 첫 화면 넘기기 ---------- */
  function initVisual() {
    var slides = $$('.vslide'), dots = $$('.vdot');
    var cur = 0, timer = null, DUR = 5500;
    function show(i) {
      slides[cur].classList.remove('is-active');
      slides[cur].setAttribute('aria-hidden', 'true');
      $('.vtext', slides[cur]).classList.remove('on');
      dots[cur].classList.remove('is-active');
      cur = (i + slides.length) % slides.length;
      slides[cur].classList.add('is-active');
      slides[cur].removeAttribute('aria-hidden');
      dots[cur].classList.add('is-active');
      var t = $('.vtext', slides[cur]);
      setTimeout(function () { t.classList.add('on'); }, 250);
      vids.forEach(function (v) { if (!slides[cur].contains(v)) v.pause(); });
      playVid(slides[cur]);
    }
    // v3.1: 선석조회 장면은 5초 영상(PC/모바일 따로). 움직임 줄이기 설정이면 마지막 장면 그림만
    var vids = $$('.vvid');
    var tallMQ = window.matchMedia('(max-width: 1023px)');   /* v3.2: 태블릿도 세로 영상(가로 영상은 표가 제목과 겹침) */
    function setVidSrc() {
      vids.forEach(function (v) {
        var k = tallMQ.matches ? 'tall' : 'wide';
        if (v.dataset.cur === k) return;
        v.dataset.cur = k;
        v.poster = v.dataset[k === 'tall' ? 'posterTall' : 'posterWide'];
        if (!reduceMQ.matches) { v.src = v.dataset[k]; v.load(); }
      });
    }
    function playVid(slide) {
      var v = $('.vvid', slide);
      if (!v || reduceMQ.matches) return;
      try { v.currentTime = 0; } catch (e) {}
      var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
    }
    setVidSrc();
    tallMQ.addEventListener('change', function () { setVidSrc(); playVid(slides[cur]); });
    // v3.1: 장면마다 머무는 시간이 다름(선석조회 장면은 data-dur로 모션이 끝날 때까지)
    function play() {
      stop();
      if (reduceMQ.matches) return;
      var d = Number(slides[cur].dataset.dur) || DUR;
      timer = setTimeout(function () { show(cur + 1); play(); }, d);
    }
    function stop() { if (timer) clearTimeout(timer); timer = null; }
    dots.forEach(function (d) { d.addEventListener('click', function () { show(Number(d.dataset.go)); play(); }); });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : play(); });
    setTimeout(function () { $('.vtext', slides[0]).classList.add('on'); }, 300);
    playVid(slides[0]);
    play();
    $('.vscroll').addEventListener('click', function () { scrollToY($('.visual').offsetHeight); });
  }

  /* ---------- 2. 한 문장 칠하기 ---------- */
  function initPhilo() {
    var sec = $('.philo');
    // 2026-11-20: 영문 꼬리표와 "하루 업무 흐름 보기" 단추를 지움 -> 낱말 칠하기만 남김
    var spans = $$('.std span', sec);
    var timers = [];
    function play() {
      reset();
      [400, 1000, 1600].forEach(function (t, k) { timers.push(setTimeout(function () { if (spans[k]) spans[k].classList.add('on'); }, t)); });
    }
    function reset() {
      timers.forEach(clearTimeout); timers = [];
      spans.forEach(function (s) { s.classList.remove('on'); });
    }
    if (reduceMQ.matches) { spans.forEach(function (s) { s.classList.add('on'); }); return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) play(); else reset(); });
    }, { rootMargin: '-45% 0px -45% 0px' }).observe(sec);
  }

  /* ---------- 3. 걱정 카드 펼치기 ---------- */
  function initEsg() {
    var items = $$('.eitem');
    function measure() {
      items.forEach(function (it) {
        var text = $('.eitem__text', it), em = $('.eng-text', it), h3 = $('h3', it), more = $('.eitem__more', it);
        var moreH = more.offsetHeight + parseFloat(getComputedStyle(more).marginTop);
        var top = text.offsetHeight - em.offsetHeight - parseFloat(getComputedStyle(h3).marginTop);
        it._collapsed = -moreH + 'px';
        it._expanded = 'calc(100% - ' + top + 'px)';
        if (!it.classList.contains('is-hover')) text.style.bottom = it._collapsed;
      });
    }
    var wide = window.matchMedia('(hover: hover) and (min-width: 1025px)');
    function set(it, on) {
      if (!wide.matches) return;
      items.forEach(function (o) { if (o !== it || !on) { o.classList.remove('is-hover'); $('.eitem__text', o).style.bottom = o._collapsed; } });
      if (on) { it.classList.add('is-hover'); $('.eitem__text', it).style.bottom = it._expanded; }
    }
    items.forEach(function (it) {
      it.addEventListener('mouseenter', function () { set(it, true); });
      it.addEventListener('mouseleave', function () { set(it, false); });
      it.addEventListener('focus', function () { set(it, true); });
      it.addEventListener('blur', function () { set(it, false); });
    });
    function apply() {
      if (wide.matches) measure();
      else items.forEach(function (it) { it.classList.remove('is-hover'); $('.eitem__text', it).style.bottom = ''; });
    }
    apply();
    window.addEventListener('resize', apply);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);
  }

  /* ---------- 4. 하루 흐름: 고정 + 옆으로 이동 ---------- */
  function initProcess() {
    return; // 2026-11-19: 내용 폭 안에 6단계를 모두 맞춰 옆으로 미는 고정 움직임은 쓰지 않음
    if (!hasGsap()) return;
    gsap.registerPlugin(ScrollTrigger);
    var sec = $('.process'), box = $('.pitems', sec);
    var mm = gsap.matchMedia();
    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', function () {
      function dist() { return Math.max(0, box.scrollWidth - (window.innerWidth - box.getBoundingClientRect().left) + 40); }
      var tw = gsap.to(box, { x: function () { return -dist(); }, ease: 'none' });
      ScrollTrigger.create({ trigger: sec, animation: tw, scrub: true, pin: true, start: 'top top', end: function () { return '+=' + (dist() + 400); }, invalidateOnRefresh: true });
      return function () { gsap.set(box, { clearProps: 'transform' }); };
    });
  }

  /* ---------- 4-1. 하루 흐름: 카드가 차례로 저절로 뒤집힘(마우스를 올리면 잠시 멈춤) ---------- */
  function initProcessAuto() {
    var sec = $('.process'), items = $$('.pitem', sec);
    var wide = window.matchMedia('(min-width: 768px)');
    var idx = -1, timer = null, seen = false, held = false;
    function step() {
      if (held) return;
      items.forEach(function (it) { it.classList.remove('is-flip'); });
      idx = (idx + 1) % items.length;
      items[idx].classList.add('is-flip');
    }
    function start() { if (timer || !wide.matches) return; step(); timer = setInterval(step, 3000); }
    function stop() { clearInterval(timer); timer = null; }
    new IntersectionObserver(function (es) {
      seen = es[0].isIntersecting;
      if (seen) start(); else { stop(); }
    }, { threshold: 0.35 }).observe(sec);
    items.forEach(function (it) {
      it.addEventListener('mouseenter', function () { held = true; items.forEach(function (o) { o.classList.remove('is-flip'); }); });
      it.addEventListener('mouseleave', function () { held = false; });
    });
    if (reduceMQ.matches) { stop(); }
  }

  /* ---------- 7. 남는 기록 카드: 그린 화면 크기 맞추기 ---------- */
  function initNewsShots() {
    function fit() {
      $$('.nitem__img').forEach(function (box) {
        var shot = $('.nitem__shot', box);
        shot.style.setProperty('--s', ((box.clientWidth - 44) / 680).toFixed(4));
      });
    }
    fit();
    window.addEventListener('resize', fit);
  }

  /* ---------- 오른쪽 아래 단추 ---------- */
  function initQuick() {
    var q = $('#float');
    new IntersectionObserver(function (es) { q.classList.toggle('is-on', !es[0].isIntersecting); }).observe($('.visual'));
    $('.fquick__top').addEventListener('click', function () { scrollToY(0); });
  }

  /* ---------- 설명선 자리 잡기(PC/태블릿): 화면 밖 상자 -> 목표 지점 선 ---------- */
  var placeQueued = false;
  function placeCallouts() {
    if (placeQueued) return;
    placeQueued = true;
    requestAnimationFrame(function () {
      placeQueued = false;
      var wide = window.matchMedia('(min-width: 768px)').matches;
      $$('.shot').forEach(function (shot) {
        var cos = $$('.callout[data-target]', shot);
        if (!cos.length) return;
        shot.classList.toggle('co-top', wide && cos.some(function (c) { return c.dataset.from === 'top'; }));
        shot.classList.toggle('co-bottom', wide && cos.some(function (c) { return c.dataset.from === 'bottom'; }));
      });
      if (!wide) return;
      $$('.shot').forEach(function (shot) {
        var sr = shot.getBoundingClientRect();
        if (!sr.width) return;
        var screen = $('.screen', shot);
        var scr = screen ? screen.getBoundingClientRect() : sr;
        $$('.callout[data-target]', shot).forEach(function (c) {
          var t = shot.querySelector(c.dataset.target);
          if (!t) return;
          var r = t.getBoundingClientRect();
          if (!r.width) return;
          // 점은 글자를 덮지 않게: 옆 지정이면 옆, 아니면 위(위에서 올 때)/아래(아래에서 올 때)
          var edge = c.dataset.edge;
          var x = (edge === 'right' ? r.right + 8 : edge === 'left' ? r.left - 8 : r.left + r.width / 2) - sr.left;
          var y = (edge ? r.top + r.height / 2 : c.dataset.from === 'bottom' ? r.bottom + 8 : r.top - 8) - sr.top;
          var len;
          if (c.dataset.from === 'top') len = y - 38;
          else if (c.dataset.from === 'bottom') len = sr.height - 40 - y;
          else { x = r.right + 8 - sr.left; len = scr.right + 24 - sr.left - x; }
          c.style.setProperty('--cx', x.toFixed(1) + 'px');
          c.style.setProperty('--cy', y.toFixed(1) + 'px');
          c.style.setProperty('--len', Math.max(12, len).toFixed(1) + 'px');
          c.classList.add('is-placed');
        });
      });
    });
  }
  /* ---------- v3.1 02 선석조회: 왼쪽 단계 고르면 화면 해당 부분 밝힘, 4초마다 다음 단계 ---------- */
  function initBerth() {
    var sec = $('.berth'); if (!sec || !$('.bpt', sec)) return;   /* v3.2: 02를 마감 시간 막대로 바꿔 이 동작은 쓰지 않음 */
    var btns = $$('.bpt', sec), shot = $('.shot--berth', sec), cur = 0, timer = null, inView = false;
    function set(i) {
      cur = i;
      btns.forEach(function (b, k) { b.classList.toggle('is-on', k === i); b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      [1, 2, 3, 4].forEach(function (n) { shot.classList.toggle('hl-' + n, n === i + 1); });
    }
    function run() { stop(); if (reduceMQ.matches || !inView) return; timer = setInterval(function () { set((cur + 1) % btns.length); }, 4000); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    btns.forEach(function (b, k) { b.addEventListener('click', function () { set(k); run(); }); });
    new IntersectionObserver(function (es) { es.forEach(function (e) { inView = e.isIntersecting; if (inView) run(); else stop(); }); }, { threshold: 0.35 }).observe(sec);
    set(0);
  }

  function initCallouts() {
    placeCallouts();
    window.addEventListener('resize', placeCallouts);
    window.addEventListener('load', placeCallouts);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeCallouts);
    document.addEventListener('click', function (e) {
      if (e.target.closest('[role="tab"], .proof-item__btn')) placeCallouts();
    });
  }

  /* ---------- 공통 탭(누르기, 화살표 키, aria) ---------- */
  function initTabs(root, onChange) {
    var tabs = $$('[role="tab"]', root);
    function select(i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var p = document.getElementById(t.getAttribute('aria-controls'));
        if (p) {
          if (onChange) p.classList.toggle('is-active', on);
          else p.hidden = !on;
        }
      });
      if (focus) tabs[i].focus();
      if (onChange) onChange(i);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, false); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(n, true); }
      });
    });
    select(0, false);
    return { select: select, count: tabs.length };
  }
  /* ---------- S6 목록 전환 ---------- */
  function initProofList() {
    var items = $$('.proof-item');
    var shots = $$('.proof-shot');
    items.forEach(function (item, i) {
      $('.proof-item__btn', item).addEventListener('click', function () {
        items.forEach(function (it, k) {
          it.classList.toggle('is-active', k === i);
          $('.proof-item__btn', it).setAttribute('aria-pressed', k === i ? 'true' : 'false');
        });
        shots.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      });
    });
  }

  /* ---------- FAQ 펼침 ---------- */
  function initFaq() {
    var sec = $('#faq');
    sec.classList.add('is-collapsible');
    $$('.faq-q', sec).forEach(function (q, i) {
      var a = document.getElementById(q.getAttribute('aria-controls'));
      function set(open) { q.setAttribute('aria-expanded', open ? 'true' : 'false'); a.hidden = !open; }
      set(i === 0);
      q.addEventListener('click', function () { set(q.getAttribute('aria-expanded') !== 'true'); });
    });
  }

  function initRoleTabs() { initTabs($(".tabs")); }

  /* ---------- S4 고정 장면 (PC 1100 이상, 움직임 줄이기 아님, GSAP 있을 때만) ---------- */
  function initCoreScenes() {
    // 2026-11-20: 스크롤로 넘기던 방식을 자동 넘김으로 바꿈. 장면마다 4초 유지 후 다음 장면(03 다음은 01).
    var HOLD = 4000;
    var sec = $('#core');
    var navs = $$('.core-nav', sec);
    var scenes = $$('.core-scene', sec);
    var cur = $('.core__cur', sec), hint = $('.core__hint', sec);
    var current = -1, t0 = 0, raf = null, visible = false;
    function setScene(i) {
      current = i;
      t0 = performance.now();
      navs.forEach(function (n, k) {
        n.classList.toggle('is-active', k === i);
        n.classList.toggle('is-done', k < i);
        n.style.setProperty('--p', k < i ? '1' : '0');
      });
      scenes.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      if (cur) cur.textContent = '0' + (i + 1);
      placeCallouts();
    }
    function tick(now) {
      raf = null;
      if (!visible) return;
      var f = Math.min(1, (now - t0) / HOLD);
      if (navs[current]) navs[current].style.setProperty('--p', f.toFixed(3));
      if (f >= 1) setScene((current + 1) % scenes.length);
      raf = requestAnimationFrame(tick);
    }
    function play() { if (!raf) { t0 = performance.now() - (parseFloat(navs[current] && navs[current].style.getPropertyValue('--p')) || 0) * HOLD; raf = requestAnimationFrame(tick); } }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }
    var mq = window.matchMedia('(min-width: 1100px) and (min-height: 700px)');
    function onNav(e) { setScene(Number(e.currentTarget.dataset.scene)); }
    var io = new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && mq.matches && !reduceMQ.matches) play(); else stop();
    }, { threshold: 0.4 });
    function apply() {
      if (mq.matches) {
        sec.classList.add('is-pinned', 'is-auto');
        if (hint) hint.style.display = 'none';   // 스크롤 안내 없음(자동으로 넘어감)
        navs.forEach(function (n) { n.addEventListener('click', onNav); });
        setScene(current < 0 ? 0 : current);
        io.observe(sec);
      } else {
        stop(); io.unobserve(sec);
        sec.classList.remove('is-pinned', 'is-auto');
        navs.forEach(function (n) { n.removeEventListener('click', onNav); n.classList.remove('is-active', 'is-done'); });
        scenes.forEach(function (s) { s.classList.remove('is-active'); });
        current = -1;
        placeCallouts();
      }
    }
    apply();
    mq.addEventListener('change', apply);
  }

  /* ---------- 칩 미리 고르기 (설계 8-2) ---------- */
  function openOptional() {
    var more = $('.form__more'), opt = $('#f-optional');
    opt.classList.add('is-open');
    more.setAttribute('aria-expanded', 'true');
  }
  function initCtaChips() {
    $$('[data-chips]').forEach(function (a) {
      a.addEventListener('click', function () {
        var names = a.dataset.chips.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        names.forEach(function (n) {
          var box = document.querySelector('input[name="topics"][value="' + n + '"]');
          if (box) box.checked = true;   // 더하기만 함
        });
        if (names.length) openOptional();
      });
    });
  }

  /* ---------- 신청 칸 (설계 8-1, 8-3, 8-4) ---------- */
  var RULES = {
    org: { test: function (v) { v = v.trim(); return v.length >= 2 && v.length <= 50; }, msg: '보관소(회사) 이름을 적어 주세요.' },
    name: { test: function (v) { v = v.trim(); return v.length >= 2 && v.length <= 20; }, msg: '담당자 이름을 적어 주세요.' },
    phone: { test: function (v) { var d = v.replace(/\D/g, ''); return /^0\d{8,10}$/.test(d); }, msg: '연락처를 숫자로 적어 주세요. 예: 010-1234-5678' },
    agree: { test: function (v, el) { return el.checked; }, msg: '개인정보 수집/이용에 동의해 주세요.' },
    memo: { test: function (v) { return v.length <= 500; }, msg: '남길 말은 500자까지 적을 수 있습니다.' }
  };

  function sendLead(data) {
    // 시안 단계: 아무것도 보내지 않고 바로 성공을 돌려줌. [확인 필요 A3] 전송 방식이 정해지면 이 함수만 바꾼다.
    void data;
    return Promise.resolve({ ok: true });
  }

  function initForm() {
    var form = $('#lead-form');
    var done = $('#done-box');
    var more = $('.form__more'), opt = $('#f-optional');
    var tried = false;
    more.addEventListener('click', function () {
      var open = more.getAttribute('aria-expanded') !== 'true';
      opt.classList.toggle('is-open', open);
      more.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    var agreeBtn = $('.agree__more'), agreeFull = $('#f-agree-full');
    agreeBtn.addEventListener('click', function () {
      var open = agreeFull.hidden;
      agreeFull.hidden = !open;
      agreeBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    var memo = $('#f-memo'), cnt = $('[data-memo-count]');
    memo.addEventListener('input', function () { cnt.textContent = memo.value.length; });

    function check(name) {
      var el = form.elements[name];
      var rule = RULES[name];
      var err = document.getElementById('f-err-' + name);
      var ok = rule.test(el.value || '', el);
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      err.hidden = ok;
      err.textContent = ok ? '' : rule.msg;
      return ok;
    }
    ['org', 'name', 'phone', 'agree', 'memo'].forEach(function (n) {
      var el = form.elements[n];
      el.addEventListener(n === 'agree' ? 'change' : 'blur', function () { if (tried) check(n); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      tried = true;
      var order = ['org', 'name', 'phone', 'agree', 'memo'];
      var firstBad = null;
      order.forEach(function (n) { if (!check(n) && !firstBad) firstBad = n; });
      if (firstBad) {
        if (firstBad === 'memo') openOptional();
        form.elements[firstBad].focus();
        return;
      }
      var topics = $$('input[name="topics"]:checked', form).map(function (b) { return b.value; });
      var data = {
        org: form.elements.org.value.trim(), name: form.elements.name.value.trim(),
        phone: form.elements.phone.value.replace(/\D/g, ''),
        yards: (form.querySelector('input[name="yards"]:checked') || {}).value || '',
        method: $$('input[name="method"]:checked', form).map(function (b) { return b.value; }),
        topics: topics,
        time: (form.querySelector('input[name="time"]:checked') || {}).value || '',
        memo: memo.value
      };
      sendLead(data).then(function () {
        form.hidden = true;
        var t = $('.done__topics', done);
        if (topics.length) { t.textContent = '고르신 궁금한 것: ' + topics.join(', '); t.hidden = false; }
        else { t.hidden = true; }
        done.hidden = false;
        $('.done__title', done).focus();
      });
    });
  }

  function init() {
    [initAni, initMagnetic, initSitemap, initVisual, initPhilo, initEsg, initProcess, initProcessAuto, initCoreScenes, initRoleTabs, initNewsShots, initFaq, initQuick, initCtaChips, initForm, initBerth, initCallouts]
      .forEach(function (fn) {
        try { fn(); } catch (err) { if (window.console) console.warn("[컨야드] " + fn.name + " 실행 실패", err); }
      });
    if (hasGsap()) window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
