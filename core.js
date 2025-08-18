const express = require("express");
const axios = require("axios");
const app = express();

async function fetchFile(url, format) {
  const api = "c7c68f45e9f08b8671969f378679a65fa0dcb249";
  const init = await axios.get(`https://p.oceansaver.in/ajax/download.php?copyright=0&format=${format}&url=${url}&api=${api}`, { responseType: "json" });
  if (!init.data.success || !init.data.id) return null;
  const id = init.data.id;
  const progUrl = `https://p.oceansaver.in/ajax/progress.php?id=${id}`;
  let prog;
  for (;;) {
  await new Promise(r => setTimeout(r, 2000));
  const res = await axios.get(progUrl, { responseType: "json" });
  prog = res.data;
  if (!prog.success) return null;
  if (prog.progress === 1000 && prog.download_url) break;}
  const file = await axios.get(prog.download_url, { responseType: "arraybuffer" });
  return { buffer: file.data.toString("base64"), downloadUrl: prog.download_url };
}

async function fetchVideos(url, quality) {
  const f = quality ? [quality] : ["360","480","720","1080"];
  const videos = {};
  for (const v of f) {
    const d = await fetchFile(url, v);
    if (d) videos[v] = d;
  }
  return videos;
}

async function fetchAudio(url) {
  return await fetchFile(url, "mp3");
}

app.get("/youtube-video", async (req, res) => {
  const url = req.query.url;
  const quality = req.query.quality;
  if (!url) return res.status(400).json({ error: "Missing url parameter" });
  try {const videos = await fetchVideos(url, quality);
  res.json({ owner: "naxordeve", video: videos });
  } catch(e) {
  res.status(500).json({ error: e.message });
  }
});

app.get("/youtube-audio", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing url parameter" });
  try {const audio = await fetchAudio(url);
  res.json({ owner: "naxordeve", audio });
  } catch(e) {
  res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log("API running on port 3000"));

/*const express = require("express");
const axios = require("axios");
const qs = require("qs");

const router = express.Router();

async function downloadFacebookVideo(fbUrl) {
  async function resolveUrl(url) {
    try {
      const res = await axios.head(url, { maxRedirects: 5 });
      return res.request.res.responseUrl || url;
    } catch {
      return url;
    }
  }

  const finalUrl = await resolveUrl(fbUrl);
  const response = await axios.post(
  "https://ssvid.net/api/ajax/search?hl=en",
  qs.stringify({ query: finalUrl }),
  { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
  const data = response.data;
  if (!data || data.status !== "ok" || !data.data || !data.data.links || !data.data.links.video) {
    throw new Error("No video found");
  }

  const videos = data.data.links.video;
  const key = Object.keys(videos)[0];
  const video = videos[key];
  if (!video.url) throw new Error("Video URL missing");
  return {
    title: data.data.title,
    size: video.size || null,
    quality: video.q_text || null,
    url: video.url,
    creator: "naxordeve"
  };
}

router.get("/download", async (req, res) => {
  const fbUrl = req.query.url;
  if (!fbUrl) {
  return res.status(400).json({ error: "Missing url query parameter" });
  }try {
  const vi = await downloadFacebookVideo(fbUrl);
  res.json(vi);
  } catch (error) {
    res.status(500).json({ error: error.message});
  }
});

module.exports = router;
*/
