const express = require("express");
const axios = require("axios");
const app = express();
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const cheerio = require("cheerio");
app.use(express.json());
const { createHash, randomUUID } = require('crypto')


const api = {
  owner: 'naxordeve',
  base: 'https://translapp.info',
  endpoint: '/ai/g/ask',
  headers: {
    'user-agent': 'Postify/1.0.0',
    'content-type': 'application/json',
    'accept-language': 'en',
  },
  modules: ['SUMMARIZE','PARAPHRASE','EXPAND','TONE','TRANSLATE','REPLY','GRAMMAR'],
  tones: ['Friendly','Romantic','Sarcastic','Humour','Social','Angry','Sad','Other'],
  replies: ['Short','Medium','Long'],

  short: (s) => s.length>=5 ? s.slice(0,5) : 'O'.repeat(5-s.length)+s,
  hash: (s) => createHash('sha256').update(s,'utf8').digest('hex'),
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function run(text, mod='', to='', custom='') {
  if(!text||!text.trim()) return { success:false, code:400, error:'Text is required' }

  if(!mod) mod = randomChoice(api.modules)
  if(!api.modules.includes(mod)) return { success:false, code:400, error:`Module must be one of: ${api.modules.join(', ')}` }

  if(mod==='TONE'){
    if(!to) to = randomChoice(api.tones)
    if(to==='Other' && !custom.trim()) custom = 'Friendly'
  }
  if(mod==='TRANSLATE' && !to.trim()) return { success:false, code:400, error:'Target language required' }
  if(mod==='REPLY'){
    if(!to) to = randomChoice(api.replies)
  }try {
    const key = api.hash(api.short(text)+'ZERO')
    const userId = 'GALAXY_AI'+randomUUID()
    const toVal = mod==='TONE'&&to==='Other'?custom:to

    const payload = { k:key, module:mod, text, to:toVal, userId }
    const { data } = await axios.post(`${api.base}${api.endpoint}`, payload, { headers: api.headers })

    return { success:true, code:200, module:mod, input:text, to:toVal, output:data.message }
  } catch(e){
    return { success:false, code:e.response?.status||500, error:e.response?.data?.message||e.message||'Error' }
  }
}

app.post('/api/ai/translapp', async (req,res)=>{
  const { text, module, to, custom } = req.body
  const r = await run(text,module,to,custom)
  res.status(r.code||200).json(r)
})

app.use("/downloadz", express.static(path.join(__dirname, "downloadz")));
const baseUrl = "https://k.kurogaze.moe";
async function fetchPage(url) {
  const { data } = await axios.get(url, {
    headers: {
      "user-agent": "Postify/1.0.0",
      accept: "text/html",
      referer: baseUrl
    },
    timeout: 15000
  });
  return cheerio.load(data);
}

async function searchAnime(keyword, page = 1) {
  const url = `${baseUrl}/page/${page}/?s=${keyword}&post_type=post`;
  const $ = await fetchPage(url);

  const results = $(".artikel-post article").toArray().map(el => {
    const wrap = $(el);
    return {
      title: wrap.find("h2.title a").text().trim(),
      link: wrap.find("h2.title a").attr("href"),
      image: wrap.find(".thumb img").attr("src")
    };
  });

  return results;
}

async function getAnimeDetails(animeUrl, req) {
  const $ = await fetchPage(animeUrl);

  const title = $("h1").text().trim();
  const sinopsis = $(".sinopsis .content").text().trim();
  const downloadLinks = [];

  $(".dlcontent .title-dl-anime").each((_, el) => {
    const episodeTitle = $(el).text().trim();
    const episodeNumber = episodeTitle.match(/Episode\s+(\d+)/i)?.[1] || null;

    $(el).next(".dl-content-for").find(".reso").each((_, r) => {
      const resolution = $(r).find("strong").text().trim();
      const mirrors = $(r).find("a").map((_, a) => {
        const fileUrl = $(a).attr("href");
        const filename = path.basename(fileUrl);
        const host = req.protocol + "://" + req.get("host");
        return {
          label: $(a).text().trim(),
          link: `${host}/downloadz/${filename}`
        };
      }).get();

      if (resolution && mirrors.length) {
        downloadLinks.push({ episode: episodeNumber, episodeTitle, resolution, mirrors });
      }
    });
  });

  return { title, sinopsis, downloadLinks };
}


app.get("/search/anime", async (req, res) => {
  const { q, page } = req.query;
  if (!q) return res.status(400).json({ error: "Missing query 'q'" });
  const results = await searchAnime(q, page || 1);
  res.json({ success: true, code: 200, result: results });
});

app.get("/download/anime", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing query 'url'" });

  const details = await getAnimeDetails(url, req);
  res.json({ success: true, code: 200, result: details });
});


const BASE = "https://spotisongdownloader.to";
const HEADERS = {
  "accept-encoding": "gzip, deflate, br, zstd",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"
};

async function hit(url, opts = {}, type = "text") {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return type === "json" ? await res.json() : await res.text();
}
async function getCookie() {
  const res = await fetch(BASE, { headers: HEADERS });
  let cookie = res.headers.get("set-cookie")?.split(";")[0] || "";
  cookie += "; _ga=GA1.1.2675401.1754827078";
  return { cookie };
}

async function ifCaptcha(cObj) {
  const url = new URL("/ifCaptcha.php", BASE);
  const headers = { ...HEADERS, ...cObj, referer: BASE };
  await hit(url, { headers });
  return headers;
}

async function singleTrack(url, h) {
  const api = new URL("/api/composer/spotify/xsingle_track.php", BASE);
  api.search = new URLSearchParams({ url });
  return await hit(api, { headers: h }, "json");
}

async function singleTrackHtml(stObj, h) {
  const data = [
    stObj.song_name,
    stObj.duration,
    stObj.img,
    stObj.artist,
    stObj.url,
    stObj.album_name,
    stObj.released
  ];
  const api = new URL("/track.php", BASE);
  const body = new URLSearchParams({ data: JSON.stringify(data) });
  return await hit(api, { headers: h, body, method: "post" });
}

async function downloadUrl(url, h, stObj) {
  const api = new URL("/api/composer/spotify/ssdw23456ytrfds.php", BASE);
  const body = new URLSearchParams({
    song_name: "",
    artist_name: "",
    url,
    zip_download: "false",
    quality: "m4a"
  });
  const data = await hit(api, { headers: h, body, method: "post" }, "json");
  return { ...data, ...stObj };
}

async function downloadTrack(url) {
  const cObj = await getCookie();
  const h = await ifCaptcha(cObj);
  const stObj = await singleTrack(url, h);
  await singleTrackHtml(stObj, h);
  return await downloadUrl(url, h, stObj);
}


async function convertToMp3WithCover(input, output, coverUrl) {
  const coverPath = path.join(__dirname, `downloads/cover-${Date.now()}.jpg`);
  const res = await fetch(coverUrl);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(coverPath, Buffer.from(buffer));
  await execPromise(`ffmpeg -y -i "${input}" -i "${coverPath}" -map 0:a -map 1:v -c:a libmp3lame -b:a 192k -id3v2_version 3 -metadata:s:v title="Album cover" -metadata:s:v comment="Cover" "${output}"`);
  fs.unlinkSync(coverPath);
}

app.use("/downloads", express.static(path.join(__dirname, "downloads")));
if (!fs.existsSync("downloads")) fs.mkdirSync("downloads");
app.get("/download/spotify", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "url query required" });

    const track = await downloadTrack(url);

    const uniq = Date.now() + Math.floor(Math.random() * 1000);
    const tmpM4a = path.join(__dirname, "downloads", `${uniq}.m4a`);
    const tmpMp3 = path.join(__dirname, "downloads", `${uniq}.mp3`);

    const fileRes = await fetch(track.dlink);
    const fileStream = fs.createWriteStream(tmpM4a);
    await new Promise((resolve, reject) => {
      fileRes.body.pipe(fileStream);
      fileRes.body.on("error", reject);
      fileStream.on("finish", resolve);
    });
    await convertToMp3WithCover(tmpM4a, tmpMp3, track.img);
    const host = req.protocol + "://" + req.get("host");
    res.json({
      owner: "naxordeve",
      song_name: track.song_name,
      artist: track.artist,
      album_name: track.album_name,
      released: track.released,
      duration: track.duration,
      thumb: track.img,
      m4a: track.dlink,                     // Direct CDN link
      mp3: `${host}/downloads/${uniq}.mp3` // Hosted MP3 with cover
    });

    fs.unlinkSync(tmpM4a);
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});
  
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

// ---------------------- START SERVER ----------------------


app.listen(3000, () => console.log("YouTube API running on port 3000"));
