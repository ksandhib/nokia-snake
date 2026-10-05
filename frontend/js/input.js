// Translates keyboard + touch events into semantic actions. Knows nothing about game state.
const KEY_DIRS = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  w: "up", s: "down", a: "left", d: "right",
};

export function initInput(on) {
  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const dir = KEY_DIRS[e.key];
    if (dir) { e.preventDefault(); on.dir(dir); return; }   // also stops page scrolling
    if (e.key === " ") e.preventDefault();
    switch (e.key.toLowerCase()) {
      case "p": on.pause(); break;
      case "r": on.restart(); break;
      case "escape": on.escape(); break;
      case "enter": on.enter(e); break;
    }
  });
  // Virtual D-pad (only visible on touch devices via CSS)
  document.querySelectorAll(".dpad button").forEach((b) =>
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); on.dir(b.dataset.dir); })
  );
}
