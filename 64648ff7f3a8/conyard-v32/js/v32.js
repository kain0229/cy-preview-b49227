/* 컨야드 랜딩 v3.2 - 02 선석조회
   1) 숫자 4개: 화면에 들어오면 0부터 올라감
   2) 마감 시간 막대: 화면에 있는 동안 반복
      막대가 18:00까지 자라며 남은 시간 0:00 -> 7:40
      -> 터미널 선석 일정 새로 받음 -> 카드 흔들림 + 마감선이 14:00으로 튀어 당겨짐, 남은 시간 7:40 -> 3:40, 빨강
      -> 경고 줄 + 이적 지시 -> 잠시 뒤 처음부터 */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1) 숫자 올리기 */
  var nums = document.querySelector('[data-b2n]');
  if (nums) {
    var counted = false;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting || counted) return; counted = true;
        nums.querySelectorAll('[data-to]').forEach(function (b, i) {
          var to = Number(b.dataset.to); if (reduce) { b.textContent = to; return; }
          b.textContent = '0';
          setTimeout(function () { tween(0, to, 900, function (v) { b.textContent = Math.round(v); }, true); }, 150 + i * 120);
        });
      });
    }, { threshold: 0.4 }).observe(nums);
  }

  /* 2) 마감 시간 막대 */
  var box = document.querySelector('[data-b2]'); if (!box) return;
  var card = box.querySelector('.b2__card'), lv = box.querySelector('.b2__left-v'), cv = box.querySelector('.b2__cut-v'),
      st = box.querySelector('.b2__state-t'), rp = box.querySelector('.b2__replay'), timers = [], raf = 0, inView = false;
  var STEPS = ['is-on', 'is-grow', 'is-sync', 'is-pulled', 'is-alert', 'is-shake', 'is-out'];

  function ease(x) { return 1 - Math.pow(1 - x, 3); }
  function tween(a, b, ms, fn, own) {   /* own: 숫자 줄처럼 막대 되감기와 상관없는 것(취소 안 됨) */
    var t0 = performance.now();
    (function f(now) { var k = Math.min(1, (now - t0) / ms); fn(a + (b - a) * ease(k)); if (k < 1) { var id = requestAnimationFrame(f); if (!own) raf = id; } })(t0);
  }
  function hm(m) { m = Math.round(m); return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); }
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function reset() {
    timers.forEach(clearTimeout); timers = []; cancelAnimationFrame(raf);
    STEPS.forEach(function (c) { card.classList.remove(c); });
    lv.textContent = '0:00'; cv.textContent = '18:00'; st.textContent = '24시간 이내';
  }
  function finalState() {
    card.classList.add('is-on', 'is-grow', 'is-sync', 'is-pulled', 'is-alert');
    lv.textContent = '3:40'; cv.textContent = '14:00'; st.textContent = '6시간 이내';
  }
  function play() {
    reset();
    if (reduce) { finalState(); return; }
    at(50, function () { card.classList.add('is-on'); });
    at(500, function () { card.classList.add('is-grow'); tween(0, 460, 1200, function (v) { lv.textContent = hm(v); }); });
    at(2500, function () { card.classList.add('is-sync'); });
    at(3500, function () {
      card.classList.add('is-pulled', 'is-shake'); cv.textContent = '14:00'; st.textContent = '6시간 이내';
      tween(460, 220, 900, function (v) { lv.textContent = hm(v); });
    });
    at(4000, function () { card.classList.remove('is-shake'); });
    at(4500, function () { card.classList.add('is-alert'); });
    at(10000, function () { card.classList.add('is-out'); });
    at(10500, function () { if (inView) play(); });
  }
  rp.addEventListener('click', play);
  new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var was = inView; inView = e.isIntersecting;
      if (inView && !was) play();
      if (!inView && was) { reset(); }
    });
  }, { threshold: 0.45 }).observe(box);
  reset();
})();
