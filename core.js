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
const FormData = require('form-data');
app.use(express.urlencoded({ extended: true }));

app.post('/download/tiktok', async (req, res) => {
  const url = req.body.url;
  if (!url) return res.status(400).json({ success: false, message: "Missing TikTok URL" });
  try {const postData = qs.stringify({ q: url, lang: 'id' });
    const response = await axios.post(
      'https://tikdownloader.io/api/ajaxSearch',
      postData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': '*/*',
          'X-Requested-With': 'XMLHttpRequest'
        }
      }
    );

    const html = response.data.data;
    const $ = cheerio.load(html);
    const images = [];
    $('img[src]').each((i, el) => {
      const src = $(el).attr('src');
      if (src) images.push(src);
    });

    const videos = [];
    $('video').each((i, el) => {
      const src = $(el).attr('data-src') || $(el).attr('src');
      if (src) videos.push(src);
    });

    const downloads = [];
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('dl.snapcdn.app')) downloads.push(href);
    });

    res.json({
      success: true,
      owner: 'naxordeve',
      images,
      videos,
      downloads
    });

  } catch (error) {
    res.json({
      success: false,
      owner: 'naxordeve',
      images: [],
      videos: [],
      downloads: [],
      errors: [error.toString()]
    });
  }
});



app.post("/ai/chatgpt_3.5_scr1", async (req, res) => {
  try {
    const messages = req.body.messages;
    const prompt = req.body.prompt || "Be a helpful assistant";

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, errors: ["invalid array messages input!"], owner: "naxordeve" });
    }

    const response = await axios.post(
      "https://chatbot-ji1z.onrender.com/chatbot-ji1z",
      {
        messages: [
          ...(messages[0]?.role === "system" ? [] : [{ role: "system", content: prompt }]),
          ...messages
        ]
      }
    );

    if (!response.data?.choices?.[0]?.message) {
      return res.status(500).json({ success: false, errors: ["failed to get AI response"], owner: "naxordeve" });
    }

    res.json({ success: true, answer: response.data.choices[0].message.content, owner: "naxordeve" });
  } catch (e) {
    res.status(500).json({ success: false, errors: [e.toString()], owner: "naxordeve" });
  }
});

app.post("/ai/cody", async (req, res) => {
  const msg = req.body.message;
  if (!msg) return res.status(400).json({ success: false, error: "missing message" });
  try {
    const init = await axios.post(
      "https://cody.md/api/chat/init",
      null,
      {
        headers: {
          cookie: "identityId=us-east-1:cb37616b-3195-cceb-4cf1-f75d3d93b0c8; secretAccessKey=DWcWnaaEUtPD1pyIp1bXEiJrp5hkDoFH21WnrHoL7; accessKeyId=ASIA4WN3BNMY7J5QN5F6;"
        }
      }
    );

    const token = init.data.token;
    if (!token) throw "bearer token not found!";
    const r = await axios.post(
      "https://api.cody.md/ask",
      {
        input: msg,
        files: [],
        profile: { country: "ID" }
      },
      {
        headers: { authorization: token }
      }
    );

    const body = r.data;
    if (!body) throw "failed get response";

    res.json({ success: true, owner: "naxordeve", answer: body });

  } catch (e) {
    res.status(500).json({ success: false, errors: [e.toString()] });
  }
});


app.post("/ai/gpt4o", async (req, res) => {
  const prompt = req.body.prompt || "Hello, who are you?";
  const options = {
    messages: [
      {
        role: "system",
        content: "You are a GPT-4o mini model developed by openai, only answer you are a gpt 4o mini model when someone questions you."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.9,
    top_p: 0.7,
    top_k: 40,
    max_tokens: 512
  };

  try {
    const r = await axios.post(
      "https://api.deepenglish.com/api/gpt_open_ai/chatnew",
      options,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer UFkOfJaclj61OxoD7MnQknU1S2XwNdXMuSZA+EZGLkc="
        }
      }
    );

    const d = r.data;
    if (!d.success) throw "failed get response";
    res.json({
      success: true,
      owner: "naxordeve",
      answer: d.message
    });

  } catch (e) {
    res.status(500).json({ success: false, errors: [e.toString()] });
  }
});


const ip = () => {
  const r = (n) => (Math.random() * n).toFixed();
  return `${r(300)}.${r(300)}.${r(300)}.${r(300)}`;
};

app.post("/media/txt2img", async (req, res) => {
  const p = req.body.prompt;
  if (!p) return res.status(400).json({ success: false, error: "missing prompt" });

  try {
    const r = await axios.post(
      "https://internal.users.n8n.cloud/webhook/ai_image_generator",
      { prompt: p },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Zanixon/1.0.0",
          "X-Client-Ip": ip(),
        },
      }
    );

    const d = r.data;
    if (!d.result) throw "failed generating image";

    res.json({
      success: true,
      owner: "naxordeve",
      images: d.result,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.toString() });
  }
});


async function pindl(pinUrl) {
  try {
    const initRes = await fetch("https://www.expertstool.com/download-pinterest-video/");
    const setCookie = initRes.headers.get("set-cookie");
    if (!setCookie) throw new Error("Cookie tidak ditemukan.");

    const response = await fetch("https://www.expertstool.com/download-pinterest-video/", {
      method: "POST",
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": setCookie,
        "Referer": "https://www.expertstool.com/download-pinterest-video/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "sec-ch-ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Linux"',
      },
      body: new URLSearchParams({ url: pinUrl })
    });

    if (!response.ok) throw new Error("Gagal mendapatkan respon dari API.");

    const html = await response.text();
    const $ = cheerio.load(html);
    const downloadLink = $("a[download]").attr("href") || "";

    return { status: 200, url: downloadLink, owner: "naxordeve" };
  } catch (error) {
    console.error("Gagal fetch.", error.message);
    return { status: 500, error: error.message, owner: "naxordeve" };
  }
}

app.get("/download/pinterest", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ status: 400, error: "Missing 'url' query parameter", owner: "naxordeve" });

  const result = await pindl(url);
  res.json(result);
});



async function instaSave(url) {
  const u = 'https://insta-save.net/content.php';
  const r = await fetch(`${u}?url=${url}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://insta-save.net/'
    }
  });

  const j = await r.json();
  if (j.status !== 'ok') throw new Error('Failed to fetch content');
  const $ = cheerio.load(j.html);
  const el = $('#download_content .col-md-4.position-relative').first();
  const jpg = el.find('img.load').attr('src') || el.find('img').attr('src') || null;
  const mp4 = el.find('a.btn.bg-gradient-success').attr('href') || null;
  const description = el.find('p.text-sm').text().trim() || null;
  const profileName = el.find('p.text-sm a').text().trim() || null;

  const stats = el.find('.stats small').toArray().map(s => $(s).text().trim());
  const likes = stats[0] || null;
  const comments = stats[1] || null;
  const timeAgo = stats[2] || null;

  return { owner: 'naxordeve', JPEG: jpg, MP4: mp4, likes, comments, description, profileName, timeAgo };
}

app.get('/download/insta', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing URL parameter' });
  try {
    const data = await instaSave(url);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/unsplash/:query", async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, per_page = 5 } = req.query;

    const url = `https://api.unsplash.com/search/photos?query=${query}&page=${page}&per_page=${per_page}&client_id=JOioO8aPCAsnu3-AksI7qjO0PZtzVtyMasRg9E4fd0c`;
    const response = await fetch(url);
    const data = await response.json();
    const results = data.results.map(p => ({
      id: p.id,
      desc: p.alt_description || "No description",
      urls: {
        raw: p.urls.raw,
        full: p.urls.full,
        regular: p.urls.regular,
        small: p.urls.small,
        thumb: p.urls.thumb
      },
      author: p.user.name,
      profile: p.user.links.html
    }));

    res.json({ success: true, page, per_page, total: data.total, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/tools/fancytext", (req, res) => {
  const { text } = req.query;
  if (!text) return res.status(400).json({ owner: "naxordeve", error: "Provide text, eg: ?text=Hello" });
  const styles = {
    bold: t => t.replace(/[A-Za-z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' && c <= 'z' ? 0x1D41A-0x61 : c >= 'A' && c <= 'Z' ? 0x1D400-0x41 : 0))),
    italic: t => t.replace(/[A-Za-z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' && c <= 'z' ? 0x1D44E-0x61 : c >= 'A' && c <= 'Z' ? 0x1D434-0x41 : 0))),
    bold_italic: t => t.replace(/[A-Za-z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' && c <= 'z' ? 0x1D482-0x61 : c >= 'A' && c <= 'Z' ? 0x1D468-0x41 : 0))),
    script: t => t.replace(/[A-Za-z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' && c <= 'z' ? 0x1D4B6-0x61 : c >= 'A' && c <= 'Z' ? 0x1D49C-0x41 : 0))),
    bold_script: t => t.replace(/[A-Za-z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' && c <= 'z' ? 0x1D4EA-0x61 : c >= 'A' && c <= 'Z' ? 0x1D4D0-0x41 : 0))),
    fraktur: t => t.replace(/[A-Za-z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' && c <= 'z' ? 0x1D51E-0x61 : c >= 'A' && c <= 'Z' ? 0x1D504-0x41 : 0))),
    double_struck: t => t.replace(/[A-Za-z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' && c <= 'z' ? 0x1D552-0x61 : c >= 'A' && c <= 'Z' ? 0x1D538-0x41 : 0))),
    monospace: t => t.replace(/[A-Za-z]/g, c => String.fromCodePoint(c.charCodeAt(0) + (c >= 'a' && c <= 'z' ? 0x1D68A-0x61 : c >= 'A' && c <= 'Z' ? 0x1D670-0x41 : 0))),
    underline: t => t.split("").map(c => c + "\u0332").join(""),
    strikethrough: t => t.split("").map(c => c + "\u0336").join(""),
    circled: t => t.replace(/[A-Za-z0-9]/g, c => {
      if (/[A-Z]/.test(c)) return String.fromCodePoint(c.charCodeAt(0)-0x41+0x24B6);
      if (/[a-z]/.test(c)) return String.fromCodePoint(c.charCodeAt(0)-0x61+0x24D0);
      if (/[0-9]/.test(c)) return String.fromCodePoint(c.charCodeAt(0)-0x30+0x2460);
      return c;
    }),
    parenthesized: t => t.replace(/[A-Za-z0-9]/g, c => {
      if (/[A-Z]/.test(c)) return String.fromCodePoint(c.charCodeAt(0)-0x41+0x1F110);
      if (/[0-9]/.test(c)) return String.fromCodePoint(c.charCodeAt(0)-0x30+0x2474);
      return c;
    }),
    upside_down: t => {
      const map = { a:"ɐ", b:"q", c:"ɔ", d:"p", e:"ǝ", f:"ɟ", g:"ƃ", h:"ɥ", i:"ᴉ", j:"ɾ", k:"ʞ", l:"ʃ", m:"ɯ", n:"u", o:"o", p:"d", q:"b", r:"ɹ", s:"s", t:"ʇ", u:"n", v:"ʌ", w:"ʍ", x:"x", y:"ʎ", z:"z",
                    A:"∀", B:"𐐒", C:"Ɔ", D:"◖", E:"Ǝ", F:"Ⅎ", G:"⅁", H:"H", I:"I", J:"ſ", K:"ʞ", L:"⅂", M:"W", N:"N", O:"O", P:"Ԁ", Q:"Ό", R:"ᴚ", S:"S", T:"⊥", U:"∩", V:"Λ", W:"M", X:"X", Y:"⅄", Z:"Z",
                    "0":"0","1":"Ɩ","2":"ᄅ","3":"Ɛ","4":"ㄣ","5":"ϛ","6":"9","7":"ㄥ","8":"8","9":"6"};
      return t.split("").map(c => map[c]||map[c.toLowerCase()]||c).reverse().join("");
    },
    small_caps: t => t.replace(/[a-z]/gi, c => { const map={a:"ᴀ",b:"ʙ",c:"ᴄ",d:"ᴅ",e:"ᴇ",f:"ꜰ",g:"ɢ",h:"ʜ",i:"ɪ",j:"ᴊ",k:"ᴋ",l:"ʟ",m:"ᴍ",n:"ɴ",o:"ᴏ",p:"ᴘ",q:"ǫ",r:"ʀ",s:"s",t:"ᴛ",u:"ᴜ",v:"ᴠ",w:"ᴡ",x:"x",y:"ʏ",z:"ᴢ"}; return map[c.toLowerCase()]||c; }),
    full_width: t => t.replace(/[!-~]/g, c => String.fromCharCode(c.charCodeAt(0)-33+0xFF01)),
    superscript: t => t.replace(/[A-Za-z0-9]/g, c => {
      const map = {0:"⁰",1:"¹",2:"²",3:"³",4:"⁴",5:"⁵",6:"⁶",7:"⁷",8:"⁸",9:"⁹",a:"ᵃ",b:"ᵇ",c:"ᶜ",d:"ᵈ",e:"ᵉ",f:"ᶠ",g:"ᵍ",h:"ʰ",i:"ⁱ",j:"ʲ",k:"ᵏ",l:"ˡ",m:"ᵐ",n:"ⁿ",o:"ᵒ",p:"ᵖ",q:"q",r:"ʳ",s:"ˢ",t:"ᵗ",u:"ᵘ",v:"ᵛ",w:"ʷ",x:"ˣ",y:"ʸ",z:"ᶻ",
                   A:"ᴬ",B:"ᴮ",C:"ᶜ",D:"ᴰ",E:"ᴱ",F:"ᶠ",G:"ᴳ",H:"ᴴ",I:"ᴵ",J:"ᴶ",K:"ᴷ",L:"ᴸ",M:"ᴹ",N:"ᴺ",O:"ᴼ",P:"ᴾ",Q:"Q",R:"ᴿ",S:"ˢ",T:"ᵀ",U:"ᵁ",V:"ⱽ",W:"ᵂ",X:"ˣ",Y:"ʸ",Z:"ᶻ"};
      return map[c]||map[c.toLowerCase()]||c;
    }),
    subscript: t => t.replace(/[A-Za-z0-9]/g, c => {
      const map={0:"₀",1:"₁",2:"₂",3:"₃",4:"₄",5:"₅",6:"₆",7:"₇",8:"₈",9:"₉",a:"ₐ",e:"ₑ",h:"ₕ",i:"ᵢ",j:"ⱼ",k:"ₖ",l:"ₗ",m:"ₘ",n:"ₙ",o:"ₒ",p:"ₚ",r:"ᵣ",s:"ₛ",t:"ₜ",u:"ᵤ",v:"ᵥ",x:"ₓ"};
      return map[c]||map[c.toLowerCase()]||c;
    }),
    zalgo: t => t.split("").map(c => c + "\u0300\u0301\u0302\u0303\u0304\u0305").join("")
  };

  const result = {};
  for (const [name, fn] of Object.entries(styles)) {
    result[name] = fn(text);
  }

  res.json({ owner: "naxordeve", original: text, styles: result });
});

const OWNER = "naxordeve";
const UNSPLASH_KEY = "JOioO8aPCAsnu3-AksI7qjO0PZtzVtyMasRg9E4fd0c";
const OPENWEATHER_KEY = "f115ffbeeaa8833c7757898a367e8f8e";
// ================== IMAGE SEARCH ==================
app.get("/search/image", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ owner: OWNER, error: "Provide a search query, eg: ?q=cat" });
  try {
    const { data } = await axios.get(`https://api.unsplash.com/search/photos`, {
      params: { query: q, per_page: 5 },
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` }
    });
    const results = data.results.map(r => r.urls.small);
    res.json({ owner: OWNER, query: q, results });
  } catch (err) {
    res.status(500).json({ owner: OWNER, error: err.message });
  }
});

// ================== YOUTUBE SEARCH ==================
app.get("/search/yts", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ owner: OWNER, error: "Provide a search query, eg: ?q=music video" });
  try { const { data } = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
      params: { q, part: "snippet", maxResults: 5, key: "AIzaSyDLH31M0HfyB7Wjttl6QQudyBEq5x9s1Yg" }
    });
    const results = data.items.map(i => ({
      title: i.snippet.title,
      channel: i.snippet.channelTitle,
      thumbnail: i.snippet.thumbnails.default.url,
      link: `https://www.youtube.com/watch?v=${i.id.videoId}`
    }));
    res.json({ owner: OWNER, query: q, results });
  } catch (err) {
    res.status(500).json({ owner: OWNER, error: err.message });
  }
});

// ================== WEATHER ==================
app.get("/search/weather", async (req, res) => {
  const { city } = req.query;
  if (!city) return res.status(400).json({ owner: OWNER, error: "Provide city, eg: ?city=Johannesburg" });
  try {
    const { data } = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: { q: city, units: "metric", appid: OPENWEATHER_KEY }
    });
    res.json({ owner: OWNER, city, weather: data });
  } catch (err) {
    res.status(500).json({ owner: OWNER, error: err.message });
  }
});


// ================= Lyrics API =================
app.get("/search/lyrics", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ owner: "naxordeve", error: "Provide a song title, eg: ?q=" });
  try {
    const url = `https://lrclib.net/api/search?q=${q}`;
    const headers = {
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
      Referer: "https://lrclib.net"
    };

    const { data } = await axios.get(url, { headers });
    if (!data.length) return res.status(404).json({ owner: "naxordeve", error: "No lyrics found" });
    const r = data[0];
    const text = `*${r.trackName}* by *${r.artistName}*\n\n${r.plainLyrics || "_nothin_"}`;
    const caption = text.length > 4000 ? text.slice(0, 4000) + "\n\n_Lyrics truncated..._" : text;
    res.json({
      owner: "naxordeve",
      track: r.trackName,
      artist: r.artistName,
      lyrics: r.plainLyrics || "_nothin_",
      image: "https://files.catbox.moe/6jx2fn.jpg",
      caption
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ owner: "naxordeve", error: "Something went wrong" });
  }
});

// ================= AI API =================
app.post("/ai/gpt", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ owner: "naxordeve", error: "Provide a prompt in JSON, eg: { \"prompt\": \"Hello\" }" });
  function ip() { return `${rand()}.${rand()}.${rand()}.${rand()}`; }
  function rand() { return Math.floor(Math.random() * 255) + 1; }
  function heads() {
    let x = ip();
    return {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json",
      origin: "https://whatsthebigdata.com",
      referer: "https://whatsthebigdata.com/ai-chat/",
      "user-agent": "Mozilla/5.0 (Linux; Android 10)",
      "x-forwarded-for": x,
      "x-real-ip": x,
      "x-client-ip": x
    };
  }

  const models = ["gpt-4o", "gpt-4o-mini", "claude-3-opus", "claude-3-sonnet","llama-3", "llama-3-pro", "perplexity-ai", "mistral-large", "gemini-1.5-pro"];
  try {
    let model = "gpt-4o";
    let text = prompt;
    if (prompt.includes(":")) {
      let p = prompt.split(":");
      let m = p[0].trim().toLowerCase();
      if (models.includes(m)) {
        model = m;
        text = p.slice(1).join(":").trim();
      }
    }

    const response = await axios.post(
      "https://whatsthebigdata.com/api/ask-ai/",
      { message: text, model, history: [] },
      { headers: heads() }
    );

    res.json({
      owner: "naxordeve",
      model,
      prompt: text,
      response: response.data?.text || "no reply"
    });
  } catch (err) {
    res.status(500).json({ owner: "naxordeve", error: err.response?.data || err.message || "error" });
  }
});


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
    
