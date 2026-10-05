// Thin same-origin wrapper around the FastAPI endpoints. Fails soft when the server is down.
async function request(path, options) {
  try {
    const res = await fetch(path, options);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export const getHighScores = () => request("/api/highscores");

export const postHighScore = (score) =>
  request("/api/highscores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ score }),
  });
