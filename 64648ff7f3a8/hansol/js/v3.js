/* CY매니저 한솔형 v1.0 - 첫 화면 사진 넘김(번호 진행 막대 + 멈춤) */
(function () {
  'use strict';
  var hero = document.querySelector('[data-hero]');
  if (!hero) return;
  var slides = hero.querySelectorAll('.hero3__slide');
  var dots = hero.querySelectorAll('.hero3__dots li');
  var pauseBtn = hero.querySelector('[data-pause]');
  var DUR = 6000, cur = 0, timer = null, paused = false, left = DUR, startAt = 0;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 숨겨 둔 사진도 미리 받아 둔다
  slides.forEach(function (s) { var im = s.querySelector('img'); if (im) im.loading = 'eager'; });

  function go(n) {
    slides[cur].classList.remove('is-active'); dots[cur].classList.remove('is-active');
    cur = (n + slides.length) % slides.length;
    // 같은 칸으로 돌아와도 애니메이션이 처음부터 돌도록 다시 그리게 한다
    var bar = dots[cur].querySelector('.hero3__bar b');
    bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
    var img = slides[cur].querySelector('img');
    img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
    slides[cur].classList.add('is-active'); dots[cur].classList.add('is-active');
    left = DUR; schedule();
  }
  function schedule() {
    clearTimeout(timer);
    if (paused || reduce) return;
    startAt = Date.now();
    timer = setTimeout(function () { go(cur + 1); }, left);
  }
  hero.style.setProperty('--dur', DUR / 1000 + 's');
  dots.forEach(function (li, i) {
    li.querySelector('button').addEventListener('click', function () { go(i); });
  });
  pauseBtn.addEventListener('click', function () {
    paused = !paused;
    hero.classList.toggle('is-paused', paused);
    pauseBtn.setAttribute('aria-label', paused ? '사진 넘김 다시 시작' : '사진 넘김 멈춤');
    pauseBtn.querySelector('use').setAttribute('href', paused ? '#i-play' : '#i-pause');
    if (paused) { clearTimeout(timer); left = Math.max(300, left - (Date.now() - startAt)); }
    else schedule();
  });
  if (reduce) { paused = true; hero.classList.add('is-paused'); }
  schedule();
})();
