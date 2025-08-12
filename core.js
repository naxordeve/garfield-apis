const express = require("express");
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
