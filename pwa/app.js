/* ─────────────────────────────────────────────────────────────
   Água — PWA de hidratação
   Estado, animação da água, histórico e lembretes locais.
   Tudo roda no aparelho: os dados ficam em localStorage.
   ───────────────────────────────────────────────────────────── */

'use strict';

const $ = (id) => document.getElementById(id);
const STORE_KEY = 'agua.v1';

/* ── Estado ───────────────────────────────────────────────── */

const DEFAULTS = {
  goal: 2000,
  cup: 250,
  quick: [200, 350, 500],
  reminders: { on: false, interval: 90, start: 8, end: 22 },
  history: {},        // { "2026-08-11": 1500 }
  nextSlot: null,     // timestamp do próximo lembrete
};

let state = load();
let lastAction = null;   // para o "Desfazer"

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const saved = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULTS),
      ...saved,
      reminders: { ...DEFAULTS.reminders, ...(saved.reminders || {}) },
      history: saved.history || {},
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    toast('Não foi possível salvar neste navegador');
  }
}

/* ── Datas ────────────────────────────────────────────────── */

const dayKey = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const todayML = () => state.history[dayKey()] || 0;

function setToday(ml) {
  const key = dayKey();
  const value = Math.max(0, Math.round(ml));
  if (value === 0) delete state.history[key];
  else state.history[key] = value;
  save();
  render();
}

/* ── Progresso ────────────────────────────────────────────── */

const progress = () => Math.min(todayML() / Math.max(state.goal, 1), 1);
const reached = () => todayML() >= state.goal;

/* ── A água (canvas) ──────────────────────────────────────── */

const canvas = $('wave');
const ctx = canvas.getContext('2d');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let level = 0;        // nível desenhado (suavizado)
let targetLevel = 0;  // nível desejado
let phase = 0;
let W = 0, H = 0;

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth;
  H = innerHeight;
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function css(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function drawWave() {
  ctx.clearRect(0, 0, W, H);

  // Sobe até no máximo 88% da tela, deixando o topo respirar
  const surface = H * (1 - level * 0.88);
  const amp = reduceMotion ? 0 : 7 + level * 5;

  const layers = [
    { off: 0,    a: amp,        speed: 1.0,  alpha: 1,   lift: 0 },
    { off: 2.1,  a: amp * 0.62, speed: 1.55, alpha: .38, lift: 9 },
  ];

  const grad = ctx.createLinearGradient(0, surface, 0, H);
  grad.addColorStop(0, css('--crest'));
  grad.addColorStop(0.45, css('--water'));
  grad.addColorStop(1, css('--deep'));

  for (const L of layers) {
    ctx.beginPath();
    ctx.moveTo(0, H);
    const base = surface + L.lift;
    for (let x = 0; x <= W; x += 6) {
      const y = base
        + Math.sin(x / 118 + phase * L.speed + L.off) * L.a
        + Math.sin(x / 47 + phase * L.speed * 1.7 + L.off) * L.a * 0.32;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.globalAlpha = L.alpha;
    ctx.fillStyle = grad;
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Brilho fino na linha d'água
  if (level > 0.005) {
    ctx.beginPath();
    for (let x = 0; x <= W; x += 6) {
      const y = surface + Math.sin(x / 118 + phase) * amp + Math.sin(x / 47 + phase * 1.7) * amp * 0.32;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(255,255,255,.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function tick() {
  level += (targetLevel - level) * 0.075;      // sobe suave
  if (!reduceMotion) phase += 0.021;
  drawWave();

  // O texto central fica submerso? Então troca o contraste.
  const readout = $('readout').getBoundingClientRect();
  const surface = H * (1 - level * 0.88);
  document.body.classList.toggle('submerged', surface < readout.top + readout.height * 0.55);

  requestAnimationFrame(tick);
}

/* ── Render ───────────────────────────────────────────────── */

function render() {
  const ml = todayML();
  const pct = Math.round(progress() * 100);

  $('amount').textContent = ml;
  $('goalText').textContent = state.goal;
  $('pct').textContent = pct + '%';
  $('cupText').textContent = state.cup;
  $('goalVal').textContent = state.goal;
  $('cupVal').textContent = state.cup;

  const status = $('status');
  if (reached()) {
    status.textContent = 'Meta batida! 🎉';
    status.classList.add('met');
  } else {
    status.classList.remove('met');
    const falta = state.goal - ml;
    status.textContent = ml === 0
      ? 'Comece o dia com um copo'
      : `Faltam ${falta} ml`;
  }

  targetLevel = progress();

  const label = new Date()
    .toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/\./g, '');
  $('todayLabel').textContent = label.charAt(0).toUpperCase() + label.slice(1);

  renderChips();
}

function renderChips() {
  const box = $('chips');
  if (box.childElementCount === state.quick.length) return;
  box.innerHTML = '';
  const glyphs = ['☕️', '🥤', '🍶'];
  state.quick.forEach((ml, i) => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.innerHTML = `<span class="glyph">${glyphs[i] || '💧'}</span><span class="val">${ml} ml</span>`;
    b.addEventListener('click', () => addWater(ml));
    box.appendChild(b);
  });
}

/* ── Ações ────────────────────────────────────────────────── */

function addWater(ml) {
  const before = todayML();
  const wasReached = reached();
  setToday(before + ml);

  lastAction = before;
  $('undo').hidden = false;
  clearTimeout(addWater._t);
  addWater._t = setTimeout(() => { $('undo').hidden = true; }, 6000);

  if (navigator.vibrate) navigator.vibrate(12);

  if (!wasReached && reached()) {
    toast('Meta do dia batida! 🎉');
  } else {
    toast(`+${ml} ml`);
  }
  scheduleNext(true);   // beber adia o próximo lembrete
}

$('addCup').addEventListener('click', () => addWater(state.cup));

$('undo').addEventListener('click', () => {
  if (lastAction === null) return;
  setToday(lastAction);
  lastAction = null;
  $('undo').hidden = true;
  toast('Desfeito');
});

/* ── Histórico ────────────────────────────────────────────── */

function lastDays(n = 7) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    out.push({ key, date: d, ml: state.history[key] || 0 });
  }
  return out;
}

function renderHistory() {
  const days = lastDays(7);
  const max = Math.max(state.goal, ...days.map((d) => d.ml), 1);
  const box = $('bars');
  box.innerHTML = '';

  const todayK = dayKey();
  days.forEach((d) => {
    const met = d.ml >= state.goal && d.ml > 0;
    const el = document.createElement('div');
    el.className = 'bar' + (met ? ' met' : '') + (d.key === todayK ? ' today' : '');
    const label = d.date.toLocaleDateString('pt-BR', { weekday: 'short' })
      .replace('.', '').slice(0, 3);
    el.innerHTML =
      `<span class="n">${d.ml || ''}</span>` +
      `<span class="col" style="height:${Math.max((d.ml / max) * 100, 0.8)}%"></span>` +
      `<span class="d">${label}</span>`;
    box.appendChild(el);
  });

  const metCount = days.filter((d) => d.ml >= state.goal && d.ml > 0).length;
  const avg = Math.round(days.reduce((s, d) => s + d.ml, 0) / days.length);
  $('statMet').textContent = `${metCount} de 7 dias`;
  $('statAvg').textContent = `${avg} ml`;
  $('statStreak').textContent = `${streak()} ${streak() === 1 ? 'dia' : 'dias'}`;
}

function streak() {
  let n = 0;
  const d = new Date();
  // O dia de hoje só conta se a meta já foi batida.
  if ((state.history[dayKey(d)] || 0) < state.goal) d.setDate(d.getDate() - 1);
  while ((state.history[dayKey(d)] || 0) >= state.goal) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/* ── Folhas ───────────────────────────────────────────────── */

function openSheet(el) {
  el.hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeSheet(el) {
  el.hidden = true;
  document.body.style.overflow = '';
}

$('openHistory').addEventListener('click', () => {
  renderHistory();
  openSheet($('historySheet'));
});
$('openSettings').addEventListener('click', () => {
  syncSettings();
  openSheet($('settingsSheet'));
});

document.querySelectorAll('[data-close]').forEach((el) => {
  el.addEventListener('click', () => closeSheet(el.closest('.sheet')));
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.querySelectorAll('.sheet:not([hidden])').forEach(closeSheet);
});

/* ── Ajustes ──────────────────────────────────────────────── */

document.querySelectorAll('[data-step]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const [field, delta] = btn.dataset.step.split(':');
    const d = Number(delta);
    if (field === 'goal') state.goal = clamp(state.goal + d, 500, 6000);
    if (field === 'cup') state.cup = clamp(state.cup + d, 50, 1000);
    save();
    render();
  });
});

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

function fillHours(select, selected) {
  select.innerHTML = '';
  for (let h = 0; h < 24; h++) {
    const o = document.createElement('option');
    o.value = h;
    o.textContent = `${String(h).padStart(2, '0')}:00`;
    if (h === selected) o.selected = true;
    select.appendChild(o);
  }
}

function syncSettings() {
  const r = state.reminders;
  $('remOn').checked = r.on;
  $('remInterval').value = String(r.interval);
  fillHours($('remStart'), r.start);
  fillHours($('remEnd'), r.end);
  $('remOpts').style.display = r.on ? '' : 'none';
  updateHint();
}

$('remOn').addEventListener('change', async (e) => {
  if (e.target.checked) {
    const ok = await askPermission();
    if (!ok) {
      e.target.checked = false;
      return;
    }
  }
  state.reminders.on = e.target.checked;
  save();
  $('remOpts').style.display = state.reminders.on ? '' : 'none';
  scheduleNext(true);
  updateHint();
});

['remInterval', 'remStart', 'remEnd'].forEach((id) => {
  $(id).addEventListener('change', () => {
    state.reminders.interval = Number($('remInterval').value);
    state.reminders.start = Number($('remStart').value);
    state.reminders.end = Number($('remEnd').value);
    save();
    scheduleNext(true);
    updateHint();
  });
});

function updateHint() {
  const r = state.reminders;
  const el = $('remHint');
  if (r.start >= r.end) {
    el.innerHTML = '<b>Atenção:</b> a hora inicial precisa ser menor que a final.';
    return;
  }
  const perDay = Math.floor(((r.end - r.start) * 60) / r.interval) + 1;
  const base = `Cerca de <b>${perDay} avisos por dia</b>, das ${String(r.start).padStart(2, '0')}h às ${String(r.end).padStart(2, '0')}h. Ao bater a meta, os avisos param até o dia seguinte.`;
  el.innerHTML = isIOS() && !isStandalone()
    ? base + '<br><br><b>No iPhone os lembretes só funcionam com o app instalado na Tela de Início</b> (veja abaixo).'
    : base + '<br><br>Os avisos disparam com o app aberto ou em segundo plano recente. Deixe o app instalado na Tela de Início para melhor resultado.';
}

$('resetDay').addEventListener('click', () => {
  setToday(0);
  toast('Dia zerado');
});

$('wipe').addEventListener('click', () => {
  if (!confirm('Apagar todo o histórico? Isso não pode ser desfeito.')) return;
  state.history = {};
  save();
  render();
  renderHistory();
  toast('Histórico apagado');
});

/* ── Notificações ─────────────────────────────────────────── */

const MESSAGES = [
  'Hora de beber água! 💧',
  'Bora se hidratar? 🚰',
  'Um copo d\'água agora vai bem 💧',
  'Seu corpo agradece: beba um gole 💦',
  'Pausa para a água! 💧',
];

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function isStandalone() {
  return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

async function askPermission() {
  if (!('Notification' in window)) {
    toast('Este navegador não suporta notificações');
    return false;
  }
  if (isIOS() && !isStandalone()) {
    toast('Instale na Tela de Início para receber lembretes');
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') {
    toast('Notificações bloqueadas nos ajustes do sistema');
    return false;
  }
  const res = await Notification.requestPermission();
  if (res !== 'granted') toast('Permissão de notificação negada');
  return res === 'granted';
}

async function notify(body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const opts = {
    body,
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: 'agua-lembrete',
    renotify: true,
  };
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg) reg.showNotification('Água', opts);
  else new Notification('Água', opts);
}

/** Calcula o próximo horário de lembrete a partir de agora. */
function computeNextSlot(from = new Date()) {
  const r = state.reminders;
  if (!r.on || r.start >= r.end) return null;

  const step = r.interval * 60000;
  const d = new Date(from);
  const startOf = (day) => {
    const t = new Date(day);
    t.setHours(r.start, 0, 0, 0);
    return t;
  };

  let slot = startOf(d);
  const endToday = new Date(d);
  endToday.setHours(r.end, 0, 0, 0);

  if (from >= slot) {
    const passos = Math.floor((from - slot) / step) + 1;
    slot = new Date(slot.getTime() + passos * step);
  }
  if (slot > endToday) {           // acabou a janela de hoje → amanhã
    const t = new Date(d);
    t.setDate(t.getDate() + 1);
    slot = startOf(t);
  }
  return slot.getTime();
}

function scheduleNext(reset = false) {
  if (!state.reminders.on) {
    state.nextSlot = null;
    save();
    return;
  }
  if (reset || !state.nextSlot || state.nextSlot < Date.now()) {
    state.nextSlot = computeNextSlot();
    save();
  }
}

/** Verifica a cada 20 s se chegou a hora de avisar. */
function reminderLoop() {
  const r = state.reminders;
  if (!r.on || !state.nextSlot) return;

  if (Date.now() >= state.nextSlot) {
    const hora = new Date().getHours();
    const dentroDaJanela = hora >= r.start && hora <= r.end;
    if (dentroDaJanela && !reached()) {
      const falta = state.goal - todayML();
      notify(`${MESSAGES[Math.floor(Math.random() * MESSAGES.length)]} Faltam ${falta} ml para a meta.`);
    }
    state.nextSlot = computeNextSlot(new Date());
    save();
  }
}

$('testNotif').addEventListener('click', async () => {
  const ok = await askPermission();
  if (!ok) return;
  await notify('Teste: é assim que o lembrete vai aparecer 💧');
  toast('Notificação enviada');
});

/* ── Instalação ───────────────────────────────────────────── */

let deferredPrompt = null;

addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  $('installCard').hidden = false;
  $('installBtn').hidden = false;
});

$('installBtn').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  $('installBtn').hidden = true;
});

/* ── Aviso flutuante ──────────────────────────────────────── */

let toastTimer;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1900);
}

/* ── Início ───────────────────────────────────────────────── */

function boot() {
  resize();
  addEventListener('resize', resize);

  // No iPhone fora da Tela de Início, explica como instalar.
  if (isIOS() && !isStandalone()) $('installCard').hidden = false;

  render();
  level = targetLevel * 0.15;   // pequena animação de entrada
  requestAnimationFrame(tick);

  scheduleNext();
  setInterval(reminderLoop, 20000);
  reminderLoop();

  // Virou o dia enquanto o app estava aberto? Redesenha.
  let shownDay = dayKey();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    if (dayKey() !== shownDay) {
      shownDay = dayKey();
      lastAction = null;
      $('undo').hidden = true;
    }
    render();
    reminderLoop();
  });

  if ('serviceWorker' in navigator) {
    addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
}

boot();
