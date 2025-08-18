const express = require("express");
const axios = require("axios");
const app = express();
const fetch = require("node-fetch");


const API_KEY = 'AIzaSyDLH31M0HfyB7Wjttl6QQudyBEq5x9s1Yg';

async function ytSearch(query, max = 1) {
  const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&part=snippet&type=video&max=${max}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.statusText}`);
  const data = await res.json();
  if (!data.items || !data.items.length) return null;

  const vid = data.items[0];
  return {
    id: vid.id.videoId,
    title: vid.snippet.title,
    url: `https://www.youtube.com/watch?v=${vid.id.videoId}`,
    thumbnail: vid.snippet.thumbnails.high.url,
    channel: vid.snippet.channelTitle,
    publishedAt: vid.snippet.publishedAt
  };
}

app.get("/download/youtube", async (req, res) => {
  try {
    let { url, query, quality } = req.query;
    quality = quality || "720";
    if (!url && !query) return res.status(400).json({ error: "Provide a url or query" });
    if (query) {
      const yt = await ytSearch(query);
      if (!yt) return res.status(404).json({ error: "No results found" });
      url = yt.url;
    }

    const match = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([\w-]{11})/);
    if (!match) return res.status(400).json({ error: "Invalid YouTube URL" });
    const vidId = match[1];
    const clean = `https://youtu.be/${vidId}`;
    const enc = encodeURIComponent(clean);

    const key = "c7c68f45e9f08b8671969f378679a65fa0dcb249";
    const videoUrl = `https://p.oceansaver.in/ajax/download.php?copyright=0&format=${quality}&url=${enc}&api=${key}`;
    const audioUrl = `https://p.oceansaver.in/ajax/download.php?copyright=0&format=mp3&url=${enc}&api=${key}`;

    const { data: v } = await axios.get(videoUrl);
    if (!v.success) return res.status(500).json({ error: `Failed ${quality}` });
    const { data: a } = await axios.get(audioUrl);
    if (!a.success) return res.status(500).json({ error: "Failed" });

    async function poll(p) {
      while (true) {
        const { data } = await axios.get(p);
        if (data.success && data.download_url) return data.download_url;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    const [mp4, mp3] = await Promise.all([poll(v.progress_url), poll(a.progress_url)]);

    res.json({
      owner: "naxordeve",
      title: v.title,
      thumb: v.info.image,
      quality,
      mp4,
      mp3,
    });
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

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
