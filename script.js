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
    if (!id) return alert('Please enter a track id');
    showResults('/spotify/track', { id });
}

function executeSpotifySearch() {
    const query = document.getElementById('spotify-search-query').value.trim();
    if (!query) return alert('Please enter a search query');
    showResults('/spotify/search', { q: query });}
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

function executeAptoideDownload() {
    const url = document.getElementById('aptoide-download-url').value.trim();
    if (!url) return alert('Please enter an APK download URL');
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; align-items: center;
        justify-content: center; z-index: 1000;
    `;
    
    const progressBox = document.createElement('div');
    progressBox.style.cssText = `
        background: white; padding: 20px; border-radius: 8px; 
        min-width: 300px; text-align: center;
    `;
    
    progressBox.innerHTML = `
        <h3>Downloading APK...</h3>
        <div style="background: #f0f0f0; border-radius: 10px; height: 20px; margin: 10px 0;">
            <div id="progress-bar" style="background: #4CAF50; height: 100%; border-radius: 10px; width: 0%; transition: width 0.3s;"></div>
        </div>
        <div id="progress-text">0%</div>
        <div id="download-info" style="margin-top: 10px; font-size: 12px; color: #666;"></div>
        <button id="cancel-download" style="margin-top: 10px; padding: 5px 15px;">Cancel</button>
    `;
    
    modal.appendChild(progressBox);
    document.body.appendChild(modal);
    const downloadUrl = `/aptoide/download?url=${url}`;
    const downloadFrame = document.createElement('iframe');
    downloadFrame.style.display = 'none';
    document.body.appendChild(downloadFrame);
    let downloadId = null;
    let progressInterval = null;
    fetch(downloadUrl, { method: 'HEAD' })
        .then(response => {
            downloadId = response.headers.get('X-Download-ID');
            if (downloadId) {
                progressInterval = setInterval(() => {
                    fetch(`/aptoide/download/progress/${downloadId}`)
                        .then(res => res.json())
                        .then(data => {
                            const progressBar = document.getElementById('progress-bar');
                            const progressText = document.getElementById('progress-text');
                            const downloadInfo = document.getElementById('download-info');
                            if (progressBar && progressText) {
                                progressBar.style.width = data.progress + '%';
                                progressText.textContent = data.progress + '%';
                                
                                if (downloadInfo && data.filename) {
                                    const formatSize = (bytes) => {
                                        if (bytes === 0) return '0 B';
                                        const k = 1024;
                                        const sizes = ['B', 'KB', 'MB', 'GB'];
                                        const i = Math.floor(Math.log(bytes) / Math.log(k));
                                        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
                                    };
                                    
                                    const sizeText = data.totalSize ? 
                                        `${formatSize(data.downloadedSize)} / ${formatSize(data.totalSize)}` : 
                                        `${formatSize(data.downloadedSize)}`;
                                    downloadInfo.textContent = `${data.filename} - ${sizeText}`;
                                }
                                
                                if (data.status === 'completed') {
                                    clearInterval(progressInterval);
                                    setTimeout(() => {
                                        document.body.removeChild(modal);
                                        document.body.removeChild(downloadFrame);
                                    }, 1000);
                                } else if (data.status === 'error') {
                                    clearInterval(progressInterval);
                                    alert('failed: ' + (data.error || 'error'));
                                    document.body.removeChild(modal);
                                    document.body.removeChild(downloadFrame);
                                }
                            }
                        })
                        .catch(err => {
                            console.error(err);
                        });
                }, 500);
            }
            
            downloadFrame.src = downloadUrl;
        })
        .catch(err => {
            console.error('Download initiation failed:', err);
            document.body.removeChild(modal);
            document.body.removeChild(downloadFrame);
        });
    
    document.getElementById('cancel-download').onclick = () => {
        if (progressInterval) clearInterval(progressInterval);
        document.body.removeChild(modal);
        document.body.removeChild(downloadFrame);
    };
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
