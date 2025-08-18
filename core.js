const express = require("express");
const axios = require("axios");
const app = express();

async function fetchYouTubeFile(url, format) {
  const api = "c7c68f45e9f08b8671969f378679a65fa0dcb249";
  const init = await axios.get(
    `https://p.oceansaver.in/ajax/download.php?copyright=0&format=${format}&url=${encodeURIComponent(
      url
    )}&api=${api}`,
    { responseType: "json" }
  );
  if (!init.data.success || !init.data.id) return null;
  const id = init.data.id;
  const progUrl = `https://p.oceansaver.in/ajax/progress.php?id=${id}`;
  let prog;
  for (;;) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await axios.get(progUrl, { responseType: "json" });
    prog = res.data;
    if (!prog.success) return null;
    if (prog.progress === 1000 && prog.download_url) break;
  }
  return { downloadUrl: prog.download_url };
}

async function fetchYouTubeVideos(url, quality) {
  const qualities = quality ? [quality] : ["360", "480", "720", "1080"];
  const videos = {};
  for (const q of qualities) {
    const d = await fetchYouTubeFile(url, q);
    if (d) videos[q] = d;
  }
  return videos;
}

async function fetchYouTubeAudio(url) {
  return await fetchYouTubeFile(url, "mp3");
}

app.get("/youtube-video", async (req, res) => {
  const url = req.query.url;
  const quality = req.query.quality;
  if (!url) return res.status(400).json({ error: "Missing url parameter" });
  try {const videos = await fetchYouTubeVideos(url, quality);
  res.json({ owner: "naxordeve", video: videos });
  } catch (e) {
  res.status(500).json({ error: e.message });
  }
});

app.get("/youtube-audio", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing url parameter" });
  try {const audio = await fetchYouTubeAudio(url);
  res.json({ owner: "naxordeve", audio });
  } catch (e) {
  res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log("YouTube API running on port 3000"));
