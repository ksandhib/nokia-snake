// UI controller + game state machine.
import { Game } from "./game.js";
import { initInput } from "./input.js";
import { getHighScores, postHighScore } from "./api.js";
import { sound } from "./sound.js";

const $ = (id) => document.getElementById(id);
const pad = (n, w = 5) => String(n).padStart(w, "0");

// MENU -> PLAYING <-> PAUSED, PLAYING -> GAME_OVER -> MENU/PLAYING, MENU <-> sub screens
const TRANSITIONS = {
  MENU: ["PLAYING", "HOW_TO_PLAY", "HIGH_SCORES", "SETTINGS"],
  PLAYING: ["PAUSED", "GAME_OVER", "MENU", "PLAYING"],
  PAUSED: ["PLAYING", "MENU"],
  GAME_OVER: ["MENU", "PLAYING"],
  HOW_TO_PLAY: ["MENU"], HIGH_SCORES: ["MENU"], SETTINGS: ["MENU"],
};
const SCREEN_OF = { MENU: "menu", PLAYING: "game", PAUSED: "game", GAME_OVER: "game",
  HOW_TO_PLAY: "how", HIGH_SCORES: "scores", SETTINGS: "settings" };
const FIRST_BUTTON = { MENU: "btn-start", GAME_OVER: "btn-again" };

// ---- Settings (localStorage) ----
const DEFAULTS = { sound: true, speed: "normal", grid: "medium", reduceMotion: false };
const settings = { ...DEFAULTS, ...(() => {
  try { return JSON.parse(localStorage.getItem("nokiaSnake.settings")) || {}; } catch { return {}; }
})() };
const CYCLES = { speed: ["normal", "fast"], grid: ["small", "medium", "large"] };

function applySettings() {
  sound.enabled = settings.sound;
  document.body.classList.toggle("reduce-motion", settings.reduceMotion);
  $("set-sound").textContent = `SOUND: ${settings.sound ? "ON" : "OFF"}`;
  $("set-speed").textContent = `GAME SPEED: ${settings.speed.toUpperCase()}`;
  $("set-grid").textContent = `GRID SIZE: ${settings.grid.toUpperCase()}`;
  $("set-motion").textContent = `REDUCED MOTION: ${settings.reduceMotion ? "ON" : "OFF"}`;
  try { localStorage.setItem("nokiaSnake.settings", JSON.stringify(settings)); } catch {}
}

// ---- State machine ----
let state = "MENU";
let high = 0;
let last = null;

function setState(next) {
  if (next !== state && !TRANSITIONS[state].includes(next)) return;
  state = next;
  document.querySelectorAll(".screen").forEach((s) => (s.hidden = s.id !== `screen-${SCREEN_OF[state]}`));
  $("ov-pause").hidden = state !== "PAUSED";
  $("ov-over").hidden = state !== "GAME_OVER";
  const id = FIRST_BUTTON[state];
  const target = id ? $(id) : document.querySelector(`#screen-${SCREEN_OF[state]} button`);
  if (state !== "PLAYING" && state !== "PAUSED" && target) target.focus();
  if (state === "HIGH_SCORES") loadScores();
}

const game = new Game($("canvas"), {
  onScore(score, level) {
    $("hud-score").textContent = pad(score);
    $("hud-level").textContent = pad(level, 2);
    if (score > high) { high = score; $("hud-high").textContent = pad(high); }
  },
  onEat: () => sound.play("eat"),
  async onOver(score) {
    sound.play("over");
    $("over-score").textContent = pad(score);
    $("over-high").textContent = pad(high);
    $("over-new").hidden = true;
    setState("GAME_OVER");
    last = score > 0 ? await postHighScore(score) : null;   // null if server unreachable
    if (last && last.top10) $("over-new").hidden = false;
  },
});

function startGame() {
  game.pause();
  sound.play("start");
  setState("PLAYING");
  game.start(settings);
  document.activeElement?.blur();
}
const goMenu = () => { game.stop(); sound.play("click"); setState("MENU"); };

async function loadHigh() {
  const list = await getHighScores();
  high = list && list.length ? list[0].score : 0;
  $("hud-high").textContent = pad(high);
}
async function loadScores() {
  const ol = $("score-list");
  const list = (await getHighScores()) || [];
  ol.innerHTML = "";
  for (let i = 0; i < 10; i++) {
    const li = document.createElement("li");
    const a = document.createElement("span"), b = document.createElement("span");
    a.textContent = `${i + 1}.`; b.textContent = list[i] ? pad(list[i].score) : "-----";
    li.append(a, b); ol.append(li);
  }
}

// ---- Buttons ----
$("btn-start").onclick = startGame;
$("btn-again").onclick = startGame;
$("btn-menu").onclick = goMenu;
$("btn-scores").onclick = () => { sound.play("click"); setState("HIGH_SCORES"); };
$("btn-how").onclick = () => { sound.play("click"); setState("HOW_TO_PLAY"); };
$("btn-settings").onclick = () => { sound.play("click"); setState("SETTINGS"); };
document.querySelectorAll(".back").forEach((b) => (b.onclick = goMenu));
$("set-sound").onclick = () => { settings.sound = !settings.sound; applySettings(); sound.play("click"); };
$("set-motion").onclick = () => { settings.reduceMotion = !settings.reduceMotion; applySettings(); };
for (const k of ["speed", "grid"]) {
  $(`set-${k}`).onclick = () => {
    const c = CYCLES[k]; settings[k] = c[(c.indexOf(settings[k]) + 1) % c.length];
    applySettings(); sound.play("click");
  };
}

// ---- Keyboard / touch actions ----
const isMenuLike = () => ["MENU", "HOW_TO_PLAY", "HIGH_SCORES", "SETTINGS", "GAME_OVER"].includes(state);

function moveFocus(step) {
  const scope = state === "GAME_OVER" ? "#ov-over" : `#screen-${SCREEN_OF[state]}`;
  const btns = [...document.querySelectorAll(`${scope} button`)];
  if (!btns.length) return;
  const i = btns.indexOf(document.activeElement);
  btns[(i + step + btns.length) % btns.length].focus();
}

initInput({
  dir(name) {
    if (state === "PLAYING") game.turn(name);
    else if (isMenuLike() && (name === "up" || name === "down")) moveFocus(name === "up" ? -1 : 1);
  },
  pause() {
    if (state === "PLAYING") { game.pause(); setState("PAUSED"); }
    else if (state === "PAUSED") { setState("PLAYING"); game.resume(); }
  },
  restart() { if (["PLAYING", "PAUSED", "GAME_OVER"].includes(state)) startGame(); },
  escape() { if (state !== "MENU") goMenu(); },
  enter(e) {
    if (state === "GAME_OVER") {
      // Enter on MAIN MENU activates that button; otherwise Play Again.
      if (document.activeElement !== $("btn-menu")) { e.preventDefault(); startGame(); }
    } else if (state === "MENU" && !(e.target instanceof HTMLButtonElement)) startGame();
    // otherwise the focused button handles Enter natively
  },
});

// Auto-pause when the tab is hidden so the snake never dies unseen.
document.addEventListener("visibilitychange", () => {
  if (document.hidden && state === "PLAYING") { game.pause(); setState("PAUSED"); }
});

applySettings();
loadHigh();
setState("MENU");
