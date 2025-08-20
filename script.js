

document.querySelectorAll('.endpoint-header').forEach(header => {
    header.addEventListener('click', () => {
        const card = header.closest('.endpoint-card');
        card.classList.toggle('expanded');
    });
});

const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.endpoint-card');
    cards.forEach(card => {
        const searchData = card.getAttribute('data-search');
        const path = card.querySelector('.endpoint-path').textContent;
        const description = card.querySelector('.endpoint-description').textContent;
        const isMatch = searchData.includes(searchTerm) || 
                       path.toLowerCase().includes(searchTerm) || 
                       description.toLowerCase().includes(searchTerm);
        
        card.style.display = isMatch ? 'block' : 'none';
    });
});

function showResults(endpoint, params) {
    const url = `/results.html?endpoint=${encodeURIComponent(endpoint)}&params=${encodeURIComponent(JSON.stringify(params))}`;
    window.open(url, '_blank');
}

function executeSpotifyTrack() {
    const id = document.getElementById('spotify-track-id').value.trim();
    if (!id) return alert('Please enter a track id');
    showResults('/spotify/track', { id });
}

function executeSpotifySearch() {
    const query = document.getElementById('spotify-search-query').value.trim();
    if (!query) return alert('Please enter a search query');
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
    
    const payload = { text, module };
    if (target) payload.to = target;
    
    // For POST requests, we need to handle differently
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/ai/translapp';
    form.target = '_blank';
    
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'data';
    input.value = JSON.stringify(payload);
    form.appendChild(input);
    
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
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
