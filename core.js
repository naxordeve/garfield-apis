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
const qs = require("querystring");
app.use(express.json());
const { createHash, randomUUID } = require('crypto');

let SPOTIFY_TOKEN = null;
let TOKEN_EXPIRES_AT = 0;

async function getSpotifyToken() {
  if (SPOTIFY_TOKEN && Date.now() < TOKEN_EXPIRES_AT) {
    return SPOTIFY_TOKEN;
  }try {
    const client_id = '4fe3fecfe5334023a1472516cc2f3d89';
    const client_secret = 'b0e756a6af0849a7ae8f59c95555e48e';
    const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");

    const res = await axios.post("https://accounts.spotify.com/api/token", "grant_type=client_credentials", {
      headers: { 
        Authorization: "Basic " + basic,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data = res.data;
    if (data.access_token) {
      SPOTIFY_TOKEN = data.access_token;
      TOKEN_EXPIRES_AT = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 min early
      console.log('New Spotify token obtained, expires in:', data.expires_in, 'seconds');
      return SPOTIFY_TOKEN;
    }
    throw new Error('No access token in response');
  } catch (error) {
    console.error('Spotify token error:', error.response?.data || error.message);
    throw new Error('Failed to get Spotify access token');
  }
}

app.get("/tools/emojimix", async (req, res) => {
  const { emoji1, emoji2 } = req.query
  if (!emoji1 || !emoji2) return res.json({ owner: "naxordeve", error: "Missing emoji1 or emoji2 parameter" })
  try {const { data } = await axios.get(`https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${emoji1}_${emoji2}`)
    if (!data || !data.results || data.results.length === 0) 
      return res.json({ owner: "naxordeve", error: "No results found" })
    const results = data.results.map(item => ({
      url: item.media_formats?.gif?.url || item.media_formats?.png_transparent?.url || null,
      preview: item.media_formats?.nanogif?.url || item.media_formats?.tinygif?.url || null
    }))

    res.json({ owner: "naxordeve", results })
  } catch (e) {
    res.json({ owner: "naxordeve", error: e.message })
  }
})
app.get("/spotify/track", async (req, res) => {
  const track_id = req.query.id
  if (!track_id) return res.status(400).json({ error: "Missing query parameter 'id'" })
  
  try {
    const token = await getSpotifyToken();
    const resData = await fetch(`https://api.spotify.com/v1/tracks/${track_id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const t = await resData.json()
    if (!t || !t.id) return res.status(404).json({ error: "Track not found or access denied" })

    const track = {
      name: t.name,
      artists: t.artists.map(a => a.name).join(', '),
      album: t.album.name,
      url: t.external_urls.spotify,
      cover: t.album.images[0]?.url
    }
    if (t.preview_url) track.preview = t.preview_url

    res.json({
      owner: "naxordeve",
      timestamp: new Date().toISOString(),
      track
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "error" })
  }
})

app.get('/search/anime', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Missing anime name' });
  try {const r = await axios.get(`https://api.jikan.moe/v4/anime?q=${name}&limit=1`);
  res.json(r.data);
  } catch (e) {
  res.status(500).json({ error: e.message });
  }
});


// ======================= TWITTER DOWNLOADER =======================
app.get('/download/twitter', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ owner: "naxordeve", error: 'Missing url' });
  try {const config = { url };
    const { data } = await axios.post(
      'https://www.expertsphp.com/instagram-reels-downloader.php',
      qs.stringify(config),
      {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'cookie': '_gid=GA1.2.1209552833.1682995186; _gat_gtag_UA_120752274_1=1; __gads=ID=e2d27851a97b70ac-222d68fe87e000b0:T=1682995185:RT=1682995185:S=ALNI_MYaXoBa8KWleDZ97JpSaXGyI7nu3g; __gpi=UID=00000be71a67625d:T=1682995185:RT=1682995185:S=ALNI_MYyedH9xuRqL2hx4rg7YyeBDzK36w; _ga_D1XX1R246W=GS1.1.1682995185.1.1.1682995205.0.0.0; _ga=GA1.1.363250370.1682995185',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
        },
      }
    );

    const $ = cheerio.load(data);
    const videoUrl = $('div.col-md-4.col-md-offset-4 > table > tbody > tr > td > video').attr('src');
    if (!videoUrl) {
      return res.status(404).json({ owner: "naxordeve", error: 'No video found. Maybe the service changed?' });
    }

    res.json({ owner: "naxordeve", success: true, video: videoUrl });

  } catch (err) {
    res.status(500).json({ owner: "naxordeve", error: err.message });
  }
});

app.get("/tools/styletext", async (req, res) => {
  try {
    let teks = req.query.text
    if (!teks) return res.json({ owner: "naxordeve", error: "No text provided" })

    let { data } = await axios.get("http://qaz.wtf/u/convert.cgi?text=" + teks)
    let $ = cheerio.load(data)
    let hasil = []
    $("table > tbody > tr").each((a, b) => {
      hasil.push({
        name: $(b).find("td:nth-child(1) > h6 > a").text(),
        result: $(b).find("td:nth-child(2)").text().trim(),
      })
    })

    res.json({ owner: "naxordeve", result: hasil })
  } catch (e) {
    res.json({ owner: "naxordeve", error: e.message })
  }
})

app.get("/spotify/search", async (req, res) => {
  const query = req.query.q
  if (!query) return res.status(400).json({ error: "Missing query parameter 'q'" })
  
  try { 
    const token = await getSpotifyToken();
    const resData = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=40`, {
    headers: { Authorization: `Bearer ${token}` }})
  const data = await resData.json()
    const tracks = data.tracks.items.map(t => {
      const track = {
        name: t.name,
        artists: t.artists.map(a => a.name).join(', '),
        album: t.album.name,
        url: t.external_urls.spotify,
        cover: t.album.images[0]?.url
      }
      if (t.preview_url) track.preview = t.preview_url
      return track
    })

    res.json({
      owner: "naxordeve",
      prompt: query,
      timestamp: new Date().toISOString(),
      results: tracks
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "error" })
  }
})

app.get('/search/github', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'Missing username' });
  try {const userRes = await axios.get(`https://api.github.com/users/${username}`);
    const user = userRes.data;
    const repoRes = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100`);
    const repos = repoRes.data.map(r => ({
      name: r.name,
      description: r.description,
      url: r.html_url,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      updated_at: r.updated_at
    }));

    res.json({
      login: user.login,
      name: user.name,
      company: user.company,
      blog: user.blog,
      location: user.location,
      email: user.email,
      bio: user.bio,
      public_repos: user.public_repos,
      followers: user.followers,
      following: user.following,
      created_at: user.created_at,
      updated_at: user.updated_at,
      avatar_url: user.avatar_url,
      repos
    });

  } catch (err) {
    res.status(500).json({ error: 'err', details: err.message });
  }
});

app.get('/tools/shorten', (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });
  const short = `https://tun.url/${Buffer.from(url).toString('base64').slice(0, 6)}`;
  res.json({ original: url, short });
});

app.get("/search/stickersearch", async (req, res) => {
  const text = req.query.query
  if (!text) return res.json({ owner: "naxordeve", error: "Missing query parameter" })

  try {
    const { data } = await axios.get(`https://getstickerpack.com/stickers?query=${text}`)
    const $ = cheerio.load(data)
    const source = []
    const link = []

    const ya = $('#stickerPacks > div > div:nth-child(3) > div > a').text()
    if (!ya) return res.json({ owner: "naxordeve", error: "No stickers found" })
    $('#stickerPacks > div > div:nth-child(3) > div > a').each((i, el) => {
      source.push($(el).attr('href'))
    })

    const packUrl = source[Math.floor(Math.random() * source.length)]
    const { data: packData } = await axios.get(packUrl)
    const $$ = cheerio.load(packData)
    $$('#stickerPack > div > div.row > div > img').each((i, el) => {
      link.push($$(el).attr('src').replace(/&d=200x200/g, ''))
    })

    res.json({
      owner: "naxordeve",
      title: $$('#intro > div > div > h1').text(),
      sticker_url: link
    })
  } catch (e) {
    res.json({ owner: "naxordeve", error: e.message })
  }
})

app.get('/tools/ssweb', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });
  
  // Check if request wants JSON response (from results page via fetch)
  const acceptHeader = req.headers.accept;
  const userAgent = req.headers['user-agent'];
  const referer = req.headers.referer;
  
  // Detect if this is coming from the results page
  if ((acceptHeader && acceptHeader.includes('application/json')) || 
      (referer && referer.includes('/results.html'))) {
    return res.json({
      owner: "naxordeve",
      success: true,
      url: url,
      screenshot_url: `/tools/ssweb?url=${encodeURIComponent(url)}&direct=1`,
      message: "Screenshot taken successfully"
    });
  }
  
  try {const resp = await axios.get(`https://image.thum.io/get/fullpage/${url}`, {
  responseType: 'arraybuffer'
  });

    res.set('Content-Type', 'image/png');
    res.send(resp.data);
  } catch (err) {
    res.status(500).json({ error: 'err', details: err.message });
  }
});


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
app.use(express.static(__dirname));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
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

// ======================= PINTEREST API =======================

const pinn = async (query) => {
    const url = "https://www.pinterest.com/resource/BaseSearchResource/get/?data=" + encodeURIComponent(JSON.stringify({ options: { query } }));
    const res = await fetch(url, {
        method: "HEAD",
        headers: {
            "screen-dpr": "4",
            "x-pinterest-pws-handler": "www/search/[scope].js",
        }
    });
    const lh = res.headers.get("Link");
    return [...lh.matchAll(/<([^>]+)>/g)].map(m => m[1]);
};

app.get('/search/pinterest', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });
  try {
    const pins = await pinn(q);
    res.json({ 
      owner: "naxordeve", 
      query: q,
      results: pins,
      count: pins.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to search Pinterest' });
  }
});

// ======================= APTOIDE API =======================

async function searchAptoide(query, limit = 5) {
  try {
    const url = `https://ws75.aptoide.com/api/7/apps/search?query=${query}&limit=${limit}`;
    const res = await axios.get(url);
    if (res.data?.datalist?.list) {
      return res.data.datalist.list
        .filter(app => app && app.name && app.file && app.file.path) 
        .map(app => ({
          owner: "naxordeve",
          id: app.id || 0,
          name: app.name,
          package: app.package,
          version: app.file?.vername,
          size: app.size || 0,
          downloads: app.stats?.downloads,
          rating: app.stats?.rating?.avg,
          developer: app.developer?.name,
          store: app.store?.name,
          icon: app.icon || '',
          download_url: app.file.path
        }));
    }
    return [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

app.get('/aptoide', async (req, res) => {
  const { q, limit } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });
  const results = await searchAptoide(q, limit || 5);
  res.json({ owner: "naxordeve", results });
});

const cnc = new Map();
app.get('/aptoide/download', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Query parameter "url" is required' });
  const dld = randomUUID();
  cnc.set(dld, { progress: 0, status: 'starting' });
  try {const xn = await axios.head(url).catch(() => null);
  const totalSize = xn ? parseInt(xn.headers['content-length'] || '0') : 0;
  const filename = url.split('/').pop() || 'app.apk';
    cnc.set(dld, { 
      progress: 0, 
      status: 'downloading', 
      filename,
      totalSize,
      downloadedSize: 0
    });
    const response = await axios.get(url, { responseType: 'stream' });
    let downloadedSize = 0;
    let actualTotalSize = totalSize;
    if (!actualTotalSize && response.headers['content-length']) {
    actualTotalSize = parseInt(response.headers['content-length']);
    }

    response.data.on('data', (chunk) => {
    downloadedSize += chunk.length;
    const progress = actualTotalSize > 0 ? Math.round((downloadedSize / actualTotalSize) * 100) : 
                     Math.min(Math.round(downloadedSize / (1024 * 1024)), 99); 
      
      cnc.set(dld, {
        progress,
        status: 'downloading',
        filename,
        totalSize: actualTotalSize,
        downloadedSize
      });
    });

    response.data.on('end', () => {
      cnc.set(dld, {
        progress: 100,
        status: 'completed',
        filename,
        totalSize: actualTotalSize || downloadedSize,
        downloadedSize
      });
      
      setTimeout(() => {
        cnc.delete(dld);
      }, 5 * 60 * 1000);
    });

    response.data.on('error', (err) => {
      cnc.set(dld, {
        progress: 0,
        status: 'error',
        error: err.message
      });
    });

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('X-Download-ID', dld);
    res.setHeader('Content-Length', actualTotalSize.toString());
    response.data.pipe(res);
  } catch (err) {
    console.error(err);
    cnc.set(dld, {
      progress: 0,
      status: 'error',
      error: err.message
    });
    res.status(500).json({ error: 'Failed to download APK' });
  }
});

app.get('/aptoide/download/progress/:id', (req, res) => {
  const { id } = req.params;
  const progress = cnc.get(id);
  if (!progress) {
  return res.status(404).json({ error: 'Download not found' });
  }
  res.json({
    owner: "naxordeve",
    downloadId: id,
    ...progress
  });
});

// ---------------------- START SERVER ----------------------


app.listen(8000, () => console.log("Garfield API running on port 8000"));
    
