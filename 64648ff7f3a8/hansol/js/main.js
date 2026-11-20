/* =========================================================
   CY매니저 랜딩 v1 - 동작
   설계 11-1 모듈 지도 순서: initHeader, initReveal, initTabs, initProofList,
   initFaq, initCoreScenes, initFloating, initCtaChips, initForm, sendLead, init
   - 스크롤 이벤트는 쓰지 않고 IntersectionObserver와 ScrollTrigger만 쓴다.
   - 한 함수가 실패해도 나머지는 돌도록 init()에서 각각 try로 감싼다.
   ========================================================= */
(function () {
  'use strict';

  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobileMQ = window.matchMedia('(max-width: 767px)');
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- 머리말: 아래 선, 지금 섹션 밑줄, 모바일 메뉴 ---------- */
  function initHeader() {
    var hdr = $('#hdr');
    var top = $('#top');
    // 스크롤 8px 넘으면 아래 선: 맨 위 8px 감시 표식으로 판단
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none;';
    document.body.prepend(sentinel);
    new IntersectionObserver(function (es) {
      hdr.classList.toggle('is-scrolled', !es[0].isIntersecting);
    }).observe(sentinel);

    // 지금 보이는 섹션 메뉴 밑줄
    var links = $$('.gnb a[data-nav]');
    var map = {};
    links.forEach(function (a) { map[a.dataset.nav] = a; });
    var ids = ['worry', 'flow', 'core', 'roles', 'start', 'faq'];
    var visible = {};
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      var cur = null;
      ids.forEach(function (id) { if (visible[id] && !cur) cur = id; });
      // proof는 roles 다음, contact는 faq 다음으로 묶어 표시
      if (!cur && visible.proof) cur = 'roles';
      links.forEach(function (a) { a.classList.toggle('is-current', a.dataset.nav === cur); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ids.concat(['proof']).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });

    // 모바일 메뉴 판
    var btn = $('.hdr__menu');
    var panel = $('#mpanel');
    function focusables() { return $$('a, button', panel).concat([btn]); }
    function open() {
      panel.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', '메뉴 닫기');
      btn.querySelector('use').setAttribute('href', '#i-close');
      document.body.classList.add('menu-open');
      document.dispatchEvent(new CustomEvent('menu:toggle', { detail: true }));
      var first = panel.querySelector('a');
      if (first) first.focus();
    }
    function close(returnFocus) {
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', '메뉴 열기');
      btn.querySelector('use').setAttribute('href', '#i-menu');
      document.body.classList.remove('menu-open');
      document.dispatchEvent(new CustomEvent('menu:toggle', { detail: false }));
      if (returnFocus) btn.focus();
    }
    btn.addEventListener('click', function () { panel.hidden ? open() : close(true); });
    $$('a', panel).forEach(function (a) { a.addEventListener('click', function () { close(false); }); });
    document.addEventListener('keydown', function (e) {
      if (panel.hidden) return;
      if (e.key === 'Escape') { close(true); return; }
      if (e.key === 'Tab') {   // 포커스 가두기
        var f = focusables();
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    mobileMQ.addEventListener('change', function (e) { if (!e.matches && !panel.hidden) close(false); });
    void top;
  }

  /* ---------- 나타나기 ---------- */
  function initReveal() {
    var els = $$('.reveal, .start__rail');
    if (reduceMQ.matches || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    els.forEach(function (el) { io.observe(el); });
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

  /* S5 사람별 탭 + S3 모바일 단계 탭 */
  function initAllTabs() {
    initTabs($('.tabs'));
    var flowTabs = $('.flow__tabs');
    var pager = $$('.pager-btn');
    var cur = 0;
    var api = initTabs(flowTabs, function (i) {
      cur = i;
      pager[0].disabled = i === 0;
      pager[1].disabled = i === api_count() - 1;
    });
    function api_count() { return 6; }
    pager.forEach(function (b) {
      b.addEventListener('click', function () {
        var n = Math.min(5, Math.max(0, cur + Number(b.dataset.flowStep)));
        api.select(n, false);
      });
    });
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

  /* ---------- S4 고정 장면 (PC 1100 이상, 움직임 줄이기 아님, GSAP 있을 때만) ---------- */
  function initCoreScenes() {
    var sec = $('#core');
    var navs = $$('.core-nav', sec);
    var scenes = $$('.core-scene', sec);
    var current = 0;
    function setScene(i) {
      if (i === current) return;
      current = i;
      navs.forEach(function (n, k) { n.classList.toggle('is-active', k === i); });
      scenes.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
    }
    if (!window.gsap || !window.ScrollTrigger) return;   // 못 불렀으면 쌓인 모양 그대로
    gsap.registerPlugin(ScrollTrigger);
    var mm = gsap.matchMedia();
    mm.add('(min-width: 1100px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)', function () {
      sec.classList.add('is-pinned');
      current = -1; setScene(0);
      var hdrH = 72;
      var st = ScrollTrigger.create({
        trigger: $('.core__pin', sec),
        start: 'top ' + hdrH + 'px',
        end: function () { return '+=' + Math.round(window.innerHeight * 2); },
        pin: true,
        anticipatePin: 1,
        onUpdate: function (self) { setScene(Math.min(2, Math.floor(self.progress * 3 - 0.0001 < 0 ? 0 : self.progress * 3))); }
      });
      function onNav(e) {
        var i = Number(e.currentTarget.dataset.scene);
        var y = st.start + (st.end - st.start) * ((i + 0.5) / 3);
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      navs.forEach(function (n) { n.addEventListener('click', onNav); });
      placeCallouts();
      return function () {   // 폭이 바뀌면 되돌림
        navs.forEach(function (n) { n.removeEventListener('click', onNav); });
        sec.classList.remove('is-pinned');
        navs.forEach(function (n) { n.classList.remove('is-active'); });
        scenes.forEach(function (s) { s.classList.remove('is-active'); });
        current = -1;
        placeCallouts();
      };
    });
  }

  /* ---------- 떠 있는 단추 / 모바일 아래 띠 ---------- */
  function initFloating() {
    var fl = $('#float'), bar = $('#float-bar');
    var heroOut = false, contactIn = false, menuOpen = false;
    function render() {
      var on = heroOut && !contactIn;
      fl.classList.toggle('is-on', on);
      bar.classList.toggle('is-on', on && !menuOpen);
      [fl, bar].forEach(function (el) {
        var vis = el === bar ? (on && !menuOpen) : on;
        el.setAttribute('aria-hidden', vis ? 'false' : 'true');
        $$('a, button', el).concat(el.tagName === 'A' ? [el] : []).forEach(function (x) { x.tabIndex = vis ? 0 : -1; });
      });
    }
    new IntersectionObserver(function (es) { heroOut = !es[0].isIntersecting; render(); }).observe($('#top'));
    new IntersectionObserver(function (es) { contactIn = es[0].isIntersecting; render(); }, { threshold: 0.1 }).observe($('#contact'));
    document.addEventListener('menu:toggle', function (e) { menuOpen = e.detail; render(); });
    $('.float__top').addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMQ.matches ? 'auto' : 'smooth' });
      $('.logo').focus();
    });
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
    [initHeader, initReveal, initAllTabs, initProofList, initFaq, initCoreScenes, initFloating, initCtaChips, initForm, initCallouts]
      .forEach(function (fn) {
        try { fn(); } catch (err) { if (window.console) console.warn('[CY매니저] ' + fn.name + ' 실행 실패', err); }
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
