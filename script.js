document.querySelectorAll('.endpoint-header').forEach(header => {
    header.addEventListener('click', () => {
        const card = header.closest('.endpoint-card');
        card.classList.toggle('expanded');
    });
});

const s = document.getElementById('searchInput');
s.addEventListener('input', (e) => {
    const st = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.endpoint-card');
    cards.forEach(card => {
        const db = card.getAttribute('data-search');
        const path = card.querySelector('.endpoint-path').textContent;
        const description = card.querySelector('.endpoint-description').textContent;
        const isMatch = db.includes(st) || 
                       path.toLowerCase().includes(st) || 
                       description.toLowerCase().includes(st);

        card.style.display = isMatch ? 'block' : 'none';
    });
});

function showResults(endpoint, params) {
    const url = `/results.html?endpoint=${endpoint}&params=${JSON.stringify(params)}`;
    window.open(url, '_blank');
}

function executeSpotifyTrack() {
    const id = document.getElementById('spotify-track-id').value.trim();
    if (!id) {
        alert('Please enter a track id');
        return;
    }
    showResults('/spotify/track', { id });
}

function executeSpotifySearch() {
    const query = document.getElementById('spotify-search-query').value.trim();
    if (!query) {
        alert('Please enter a search query');
        return;
    }
    showResults('/spotify/search', { q: query });
}
function executeAnimeSearch() {
    const query = document.getElementById('anime-search-query').value.trim();
    const page = document.getElementById('anime-search-page').value.trim();
    if (!query) return alert('Please enter a search query');
    const params = { q: query };
    if (page) params.page = page;
    showResults('/search/anime', params);
}

function executeGithubSearch() {
    const username = document.getElementById('github-username').value.trim();
    if (!username) return alert('Please enter a GitHub username');
    showResults('/search/github', { username });
}

function executeUrlShorten() {
    const url = document.getElementById('shorten-url').value.trim();
    if (!url) return alert('Please enter a URL');
    showResults('/tools/shorten', { url });
}

function executeScreenshot() {
    const url = document.getElementById('screenshot-url').value.trim();
    if (!url) return alert('Please enter a website URL');
    showResults('/tools/ssweb', { url });
}

function executeAiProcess() {
    const text = document.getElementById('ai-text').value.trim();
    const module = document.getElementById('ai-module').value;
    const target = document.getElementById('ai-target').value.trim();

    if (!text) return alert('Please enter text to process');
    
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Loading...';
    button.disabled = true;
    
    const payload = { text, module };
    if (target) payload.to = target;
    
    const url = `/post-results.html?endpoint=${encodeURIComponent('/api/ai/translapp')}&params=${encodeURIComponent(JSON.stringify(payload))}`;
    
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 1000);
    
    window.open(url, '_blank');
}

function executeSpotifyDownload() {
    const url = document.getElementById('spotify-download-url').value.trim();
    if (!url) return alert('Please enter a Spotify track url');
    showResults('/download/spotify', { url });
}

function executeYoutubeDownload() {
    const input = document.getElementById('youtube-input').value.trim();
    const quality = document.getElementById('youtube-quality').value;
    if (!input) return alert('Please enter a YouTube url or search query');

    const params = {};
    if (input.includes('youtube.com') || input.includes('youtu.be')) {
        params.url = input;
    } else {
        params.query = input;
    }
    if (quality) params.quality = quality;

    showResults('/download/youtube', params);
}

function executeAnimeDownload() {
    const url = document.getElementById('anime-download-url').value.trim();
    if (!url) return alert('Please enter an anime page url');
    showResults('/download/anime', { url });
}

function executeEmojiMix() {
    const emoji1 = document.getElementById('emoji1').value.trim();
    const emoji2 = document.getElementById('emoji2').value.trim();
    if (!emoji1 || !emoji2) return alert('Please enter both emojis');
    showResults('/tools/emojimix', { emoji1, emoji2 });
}

function executeStyleText() {
    const text = document.getElementById('style-text').value.trim();
    if (!text) return alert('Please enter text to style');
    showResults('/tools/styletext', { text });
}

function executeStickerSearch() {
    const query = document.getElementById('sticker-query').value.trim();
    if (!query) return alert('Please enter a search query');
    showResults('/search/stickersearch', { query });
}

function executeTwitterDownload() {
    const url = document.getElementById('twitter-url').value.trim();
    if (!url) return alert('Please enter a Twitter URL');
    showResults('/download/twitter', { url });
}

function executeYoutubeVideo() {
    const url = document.getElementById('yt-video-url').value.trim();
    const quality = document.getElementById('yt-video-quality').value;
    if (!url) return alert('Please enter a YouTube URL');
    const params = { url };
    if (quality) params.quality = quality;
    showResults('/youtube-video', params);
}

function executeYoutubeAudio() {
    const url = document.getElementById('yt-audio-url').value.trim();
    if (!url) return alert('Please enter a YouTube URL');
    showResults('/youtube-audio', { url });
}

function executeAptoideSearch() {
    const query = document.getElementById('aptoide-query').value.trim();
    const limit = document.getElementById('aptoide-limit').value.trim();
    if (!query) return alert('Please enter a search query');
    const params = { q: query };
    if (limit) params.limit = limit;
    showResults('/aptoide', params);
}

function executePinterestSearch() {
    const query = document.getElementById('pinterest-query').value.trim();
    if (!query) return alert('Please enter a search query');
    showResults('/search/pinterest', { q: query });
}
function executeTxt2Img() {
    const prompt = document.getElementById('txt2img-prompt').value.trim();
    if (!prompt) return alert('Please enter an image prompt');
    
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Loading...';
    button.disabled = true;
    
    const payload = { prompt };
    const url = `/post-results.html?endpoint=${encodeURIComponent('/media/txt2img')}&params=${encodeURIComponent(JSON.stringify(payload))}`;
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 1000);
    
    window.open(url, '_blank');
}

function executeUnsplash() {
    const query = document.getElementById('unsplash-query').value.trim();
    const page = document.getElementById('unsplash-page').value.trim();
    const per_page = document.getElementById('unsplash-per-page').value.trim();
    if (!query) return alert('Please enter a search query');
    const params = {};
    if (page) params.page = page;
    if (per_page) params.per_page = per_page;
    showResults(`/unsplash/${encodeURIComponent(query)}`, params);
}

function executeImageSearch() {
    const query = document.getElementById('image-search-query').value.trim();
    if (!query) return alert('Please enter a search query');
    showResults('/search/image', { q: query });
}

function executePinterestDownload() {
    const url = document.getElementById('pinterest-download-url').value.trim();
    if (!url) return alert('Please enter a Pinterest URL');
    showResults('/download/pinterest', { url });
}

function executeInstagramDownload() {
    const url = document.getElementById('instagram-url').value.trim();
    if (!url) return alert('Please enter an Instagram URL');
    showResults('/download/insta', { url });
}

function executeTikTokDownload() {
    const url = document.getElementById('tiktok-url').value.trim();
    if (!url) return alert('Please enter a TikTok URL');
    
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Loading...';
    button.disabled = true;
    
    const payload = { url };
    const postUrl = `/post-results.html?endpoint=${encodeURIComponent('/download/tiktok')}&params=${encodeURIComponent(JSON.stringify(payload))}`;
    
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 1000);
    
    window.open(postUrl, '_blank');
}

function executeFancyText() {
    const text = document.getElementById('fancy-text').value.trim();
    if (!text) return alert('Please enter text');
    showResults('/tools/fancytext', { text });
}

function executeYtsSearch() {
    const query = document.getElementById('yts-query').value.trim();
    if (!query) return alert('Please enter a search query');
    showResults('/search/yts', { q: query });
}

function executeWeatherSearch() {
    const city = document.getElementById('weather-city').value.trim();
    if (!city) return alert('Please enter a city name');
    showResults('/search/weather', { city });
}

function executeLyricsSearch() {
    const query = document.getElementById('lyrics-query').value.trim();
    if (!query) return alert('Please enter a song search');
    showResults('/search/lyrics', { q: query });
}

function executeChatGPT() {
    const messagesText = document.getElementById('chatgpt-messages').value.trim();
    const prompt = document.getElementById('chatgpt-prompt').value.trim();
    if (!messagesText) return alert('Please enter messages');
    const button = event.target;
    const originalText = button.textContent;
    
    try {
        const messages = JSON.parse(messagesText);
        const payload = { messages };
        if (prompt) payload.prompt = prompt;
        
        button.textContent = 'Loading...';
        button.disabled = true;
        
        const url = `/post-results.html?endpoint=${encodeURIComponent('/ai/chatgpt_3.5_scr1')}&params=${encodeURIComponent(JSON.stringify(payload))}`;
        
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 1000);
        
        window.open(url, '_blank');
    } catch (e) {
        alert('Invalid JSON format for messages');
    }
}

function executeCody() {
    const message = document.getElementById('cody-message').value.trim();
    if (!message) return alert('Please enter a message');
    
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Loading...';
    button.disabled = true;
    
    const payload = { message };
    const url = `/post-results.html?endpoint=${encodeURIComponent('/ai/cody')}&params=${encodeURIComponent(JSON.stringify(payload))}`;
    
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 1000);
    
    window.open(url, '_blank');
}

function executeGPT4o() {
    const prompt = document.getElementById('gpt4o-prompt').value.trim();
    if (!prompt) return alert('Please enter a prompt');
    
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Loading...';
    button.disabled = true;
    
    const payload = { prompt };
    const url = `/post-results.html?endpoint=${encodeURIComponent('/ai/gpt4o')}&params=${encodeURIComponent(JSON.stringify(payload))}`;
    
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 1000);
    
    window.open(url, '_blank');
}

function executeGPTGeneral() {
    const prompt = document.getElementById('gpt-general-prompt').value.trim();
    if (!prompt) return alert('Please enter a prompt');
    
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Loading...';
    button.disabled = true;
    
    const payload = { prompt };
    const url = `/post-results.html?endpoint=${encodeURIComponent('/ai/gpt')}&params=${encodeURIComponent(JSON.stringify(payload))}`;
    
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 1000);
    
    window.open(url, '_blank');
}

function executeAptoideDownload() {
    const url = document.getElementById('aptoide-download-url').value.trim();
    if (!url) return alert('Please enter an APK download URL');
    showResults('/aptoide/download', { url });
}



document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.endpoint-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
});
