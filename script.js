const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.desktop-nav');

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? '打开导航' : '关闭导航');
  navigation.classList.toggle('open', !isOpen);
});

navigation.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '打开导航');
    navigation.classList.remove('open');
  });
});

const sceneButtons = [...document.querySelectorAll('.scene-button')];
const playButton = document.querySelector('.storyboard-play');
const storyboardStatus = document.querySelector('.storyboard-status');
const chartPoints = [...document.querySelectorAll('.chart-point')];
let currentScene = 0;
let playbackTimer;
let playbackStartedAt = 0;

function selectScene(index) {
  currentScene = index;
  sceneButtons.forEach((button, buttonIndex) => {
    const active = buttonIndex === index;
    button.classList.toggle('is-active', active);
    if (active) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  chartPoints.forEach((point, pointIndex) => point.classList.toggle('is-current', pointIndex === index));
  const time = sceneButtons[index].querySelector('time').textContent.replace('s', ' 秒');
  storyboardStatus.textContent = `第 ${index + 1} 幕 · ${time}`;
}

const projectFilm = document.querySelector('.project-film');
const animationPreload = new Image();
const animationReady = new Promise((resolve) => {
  animationPreload.onload = () => resolve(true);
  animationPreload.onerror = () => resolve(false);
  animationPreload.src = projectFilm.dataset.animation;
});

function stopPlayback(completed = false) {
  window.clearInterval(playbackTimer);
  playbackTimer = undefined;
  playButton.setAttribute('aria-pressed', 'false');
  playButton.textContent = completed ? '↻ 重播视频与脚本' : '▶ 播放视频与脚本';
  playButton.disabled = false;
  projectFilm.src = projectFilm.dataset.poster;
  if (completed) storyboardStatus.textContent = '播放完成 · 共 15 秒';
  else selectScene(0);
}

playButton.addEventListener('click', async () => {
  if (playbackTimer) {
    stopPlayback();
    return;
  }

  playButton.disabled = true;
  playButton.textContent = '加载短片中…';
  const loaded = await animationReady;
  if (!loaded) {
    playButton.disabled = false;
    playButton.textContent = '▶ 播放视频与脚本';
    storyboardStatus.textContent = '短片加载失败，请刷新页面重试';
    return;
  }
  projectFilm.src = projectFilm.dataset.animation;
  await new Promise(requestAnimationFrame);
  playButton.setAttribute('aria-pressed', 'true');
  playButton.textContent = '■ 停止视频与脚本';
  playButton.disabled = false;
  selectScene(0);
  playbackStartedAt = performance.now();
  playbackTimer = window.setInterval(() => {
    const elapsed = (performance.now() - playbackStartedAt) / 1000;
    if (elapsed >= 15) {
      selectScene(sceneButtons.length - 1);
      stopPlayback(true);
      return;
    }
    const nextScene = elapsed < 3.7 ? 0 : elapsed < 7.4 ? 1 : elapsed < 11.1 ? 2 : 3;
    if (nextScene !== currentScene) selectScene(nextScene);
  }, 50);
});

const revealItems = document.querySelectorAll('.section-heading, .featured-case, .about-inner, .focus-grid, .contact');
const copyEmailButton = document.querySelector('.copy-email');
const copyStatus = document.querySelector('.copy-status');
if (copyEmailButton && copyStatus) {
  copyEmailButton.addEventListener('click', async () => {
    const email = copyEmailButton.dataset.copyEmail;
    try {
      await navigator.clipboard.writeText(email);
      copyStatus.textContent = '已复制邮箱';
    } catch {
      const input = document.createElement('textarea');
      input.value = email;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      const copied = document.execCommand('copy');
      input.remove();
      copyStatus.textContent = copied ? '已复制邮箱' : '请选中邮箱文字后按 Ctrl+C 复制';
    }
  });
}

if ('IntersectionObserver' in window) {
  revealItems.forEach((item) => item.classList.add('reveal'));
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => revealObserver.observe(item));

  const navLinks = [...navigation.querySelectorAll('a')];
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach((link) => {
      const active = link.hash === `#${visible.target.id}`;
      link.classList.toggle('is-current', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.2, 0.5] });
  ['work', 'about', 'skills'].forEach((id) => {
    const section = document.getElementById(id);
    if (section) sectionObserver.observe(section);
  });
}

