document.addEventListener('DOMContentLoaded', () => {
    // Toast Notification System
    const toastHtml = `<div id="vibio-toast" class="toast-notification"></div>`;
    document.body.insertAdjacentHTML('beforeend', toastHtml);
    const toast = document.getElementById('vibio-toast');

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Global Floating Audio Player
    const playerHtml = `
        <div id="lyrics-container">
            <button id="close-lyrics" style="position: absolute; top: 15px; right: 20px; background: none; border: none; color: #a2adcf; cursor: pointer; font-size: 1.2rem;">✖</button>
            <p id="lyrics-text">Lyrics loading... 🎵</p>
        </div>
        <div id="global-audio-player-container">
            <img id="global-audio-img" src="" alt="Album Art">
            <div id="global-audio-info">
                <div id="global-audio-title">Song Title</div>
                <div id="global-audio-artist">Artist</div>
            </div>
            <div id="global-audio-controls">
                <button id="player-play-pause">▶</button>
                <div class="slider-container">
                    <span id="current-time">0:00</span>
                    <input type="range" id="seek-slider" value="0" max="100">
                    <span id="total-duration">0:00</span>
                </div>
                <button id="toggle-lyrics" title="Show Lyrics">📜</button>
            </div>
            <audio id="global-audio-element"></audio>
            <button id="global-audio-close">✖</button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', playerHtml);

    const playerContainer = document.getElementById('global-audio-player-container');
    const audioEl = document.getElementById('global-audio-element');
    const audioImg = document.getElementById('global-audio-img');
    const audioTitle = document.getElementById('global-audio-title');
    const audioArtist = document.getElementById('global-audio-artist');
    const closeBtn = document.getElementById('global-audio-close');
    const playPauseBtn = document.getElementById('player-play-pause');
    const seekSlider = document.getElementById('seek-slider');
    const currentTimeText = document.getElementById('current-time');
    const durationText = document.getElementById('total-duration');
    const lyricsBtn = document.getElementById('toggle-lyrics');
    const lyricsContainer = document.getElementById('lyrics-container');
    const lyricsText = document.getElementById('lyrics-text');
    let currentLyricsKey = '';

    async function tryFetchLyrics(artist, title) {
        const response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
        if (!response.ok) throw new Error('Not found');
        const data = await response.json();
        if (data && data.lyrics && data.lyrics.trim().length > 10) return data.lyrics;
        throw new Error('Empty lyrics');
    }

    async function tryFetchLrcLib(artist, title) {
        const response = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`);
        if (!response.ok) throw new Error('Not found');
        const data = await response.json();
        // Return plain lyrics if available
        if (data && data.plainLyrics) return data.plainLyrics;
        return null;
    }

    async function fetchLyrics(artist, title) {
        if (!artist || !title || artist === 'Artist' || title === 'Song Title') {
            lyricsText.textContent = "Play a song to see lyrics! 🎵";
            return;
        }

        const songKey = `${artist}-${title}`;
        // If it's the same song and we already have content, don't re-fetch
        if (currentLyricsKey === songKey && lyricsText.innerHTML.length > 100) return;
        currentLyricsKey = songKey;

        console.log(`Searching lyrics for: ${artist} - ${title}`);
        lyricsText.innerHTML = '<div class="lyrics-loader">Searching for lyrics... 🔍</div>';

        // Build multiple search strategies
        const cleanArtist = artist.split('(')[0].split('-')[0].split('[')[0].trim();
        const cleanTitle  = title.split('(')[0].split('-')[0].split('[')[0].trim();
        // First word of artist (handles "Honey singh or Badshah" → "Honey")
        const firstArtist = cleanArtist.split(/\s+or\s+|\s+&\s+|,|\s+ft\.?\s+|\s+feat\.?\s+/i)[0].trim();
        // Romanised Indian song names sometimes have different spellings; try title only with first artist
        const strategies = [
            [cleanArtist, cleanTitle],
            [firstArtist, cleanTitle],
            [cleanArtist, title.trim()],
            [firstArtist, title.trim()],
        ];

        let foundLyrics = null;
        for (const [a, t] of strategies) {
            // Strategy: Try both APIs for these specific cleaned strings
            try {
                foundLyrics = await tryFetchLrcLib(a, t);
            } catch (e) { console.log("LRCLIB failed for strategy", a, t); }

            if (!foundLyrics) {
                try {
                    foundLyrics = await tryFetchLyrics(a, t);
                } catch (e) { console.log("Lyrics.ovh failed for strategy", a, t); }
            }

            if (foundLyrics) break;
        }

        if (foundLyrics) {
            lyricsText.innerHTML = foundLyrics.replace(/\n/g, '<br>');
            lyricsContainer.scrollTop = 0;
        } else {
            console.warn(`Lyrics not found for: ${artist} - ${title}`);
            const googleQuery = encodeURIComponent(`${title} ${cleanArtist} lyrics`);
            lyricsText.innerHTML = `<div style="padding: 20px; text-align: center;">
                <div style="font-size: 1.5rem; margin-bottom: 10px;">🏜️</div>
                <div style="font-weight: 600; margin-bottom: 6px;">Lyrics not found</div>
                <div style="font-size: 0.85rem; color: #a2adcf; margin-bottom: 14px;">
                    "${title}" by ${cleanArtist} isn't in our lyrics database yet.
                </div>
                <a href="https://www.google.com/search?q=${googleQuery}" target="_blank"
                   style="display:inline-block; padding: 8px 16px; background: rgba(192,132,252,0.2);
                          color: #c084fc; border: 1px solid #c084fc; border-radius: 20px;
                          text-decoration: none; font-size: 0.82rem;">
                    🔍 Search on Google
                </a>
            </div>`;
            currentLyricsKey = ''; // allow retry next open
        }
    }

    lyricsBtn.addEventListener('click', () => {
        const isShowing = lyricsContainer.classList.toggle('show');
        lyricsBtn.classList.toggle('active');

        if (isShowing) {
            currentLyricsKey = '';
            fetchLyrics(audioArtist.textContent, audioTitle.textContent);
        }
    });

    document.getElementById('close-lyrics').onclick = () => {
        lyricsContainer.classList.remove('show');
        lyricsBtn.classList.remove('active');
    };

    function formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    closeBtn.addEventListener('click', () => {
        audioEl.pause();
        playerContainer.classList.remove('show');
        audioImg.classList.remove('playing');
    });

    playPauseBtn.addEventListener('click', () => {
        if (audioEl.paused) {
            audioEl.play();
        } else {
            audioEl.pause();
        }
    });

    audioEl.addEventListener('play', () => {
        audioImg.classList.add('playing');
        playPauseBtn.textContent = '⏸';
    });

    audioEl.addEventListener('pause', () => {
        audioImg.classList.remove('playing');
        playPauseBtn.textContent = '▶';
    });

    audioEl.addEventListener('ended', () => {
        audioImg.classList.remove('playing');
        playPauseBtn.textContent = '▶';
        seekSlider.value = 0;
        currentTimeText.textContent = '0:00';
    });

    audioEl.addEventListener('loadedmetadata', () => {
        seekSlider.max = Math.floor(audioEl.duration);
        durationText.textContent = formatTime(audioEl.duration);
    });

    audioEl.addEventListener('timeupdate', () => {
        if (!seekSlider.classList.contains('seeking')) {
            seekSlider.value = Math.floor(audioEl.currentTime);
            currentTimeText.textContent = formatTime(audioEl.currentTime);
            
            // Progress background
            const progress = (audioEl.currentTime / audioEl.duration) * 100;
            seekSlider.style.background = `linear-gradient(to right, #c084fc ${progress}%, rgba(255, 255, 255, 0.1) ${progress}%)`;
        }
    });

    seekSlider.addEventListener('input', () => {
        seekSlider.classList.add('seeking');
        currentTimeText.textContent = formatTime(seekSlider.value);
        
        // Manual progress update
        const progress = (seekSlider.value / seekSlider.max) * 100;
        seekSlider.style.background = `linear-gradient(to right, #c084fc ${progress}%, rgba(255, 255, 255, 0.1) ${progress}%)`;
    });

    seekSlider.addEventListener('change', () => {
        audioEl.currentTime = seekSlider.value;
        seekSlider.classList.remove('seeking');
    });

    // Handle Playlist Add Clicks for Search Results
    function handlePlaylistAdd(btn, trackData) {
        const modal = btn.nextElementSibling;
        
        btn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            document.querySelectorAll('.playlist-selector-modal').forEach(m => m.classList.remove('show'));
            
            const playlists = window.PlaylistManager ? window.PlaylistManager.getPlaylists() : [];
            
            if (playlists.length === 0) {
                showToast('❌ Create a playlist first!');
                setTimeout(() => window.location.href = 'createPlaylist.html', 1500);
                return;
            }

            modal.innerHTML = '<div style="font-size:0.7rem; color:#a2adcf; margin-bottom:5px; text-align:center;">Add to...</div>';
            
            playlists.forEach(p => {
                const pItem = document.createElement('div');
                pItem.className = 'playlist-selector-item';
                pItem.textContent = p.name;
                pItem.addEventListener('click', (pEv) => {
                    pEv.stopPropagation();
                    const success = window.PlaylistManager.addSong(p.id, trackData);
                    if (success) showToast('✅ Added to ' + p.name);
                    else showToast('⚠️ Already in playlist!');
                    modal.classList.remove('show');
                });
                modal.appendChild(pItem);
            });
            modal.classList.add('show');
        });
    }

    // Search Logic (Updated to use handlePlaylistAdd)
    const searchContainers = document.querySelectorAll('.search-container');
    const overlay = document.getElementById('search-results-overlay');
    const overlayGrid = document.getElementById('search-results-grid');
    const queryDisplay = document.getElementById('search-query-display');
    const closeSearchBtn = document.getElementById('close-search-btn');
    
    // Elements to hide when search is active
    const mainContentElements = document.querySelectorAll('.section-header, .playlist-scroll, .cards-grid, .footer-section, .discover-hero, .genre-grid, .station-hero, .featured-mix, .now-playing-section');

    if (closeSearchBtn && overlay) {
        closeSearchBtn.addEventListener('click', () => {
            overlay.classList.remove('active');
            mainContentElements.forEach(el => el.style.display = '');
            document.querySelectorAll('.search-input').forEach(i => i.value = '');
        });
    }
    
    searchContainers.forEach(container => {
        const input = container.querySelector('.search-input');
        if (!input) return;

        // Fallback dropdown if overlay doesn't exist
        let dropdown = null;
        if (!overlay) {
            const dropdownHtml = `<div class="search-results-dropdown"></div>`;
            container.insertAdjacentHTML('beforeend', dropdownHtml);
            dropdown = container.querySelector('.search-results-dropdown');
        }

        let timeout = null;

        input.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            clearTimeout(timeout);
            
            if (query.length < 2) {
                if (overlay) {
                    overlay.classList.remove('active');
                    mainContentElements.forEach(el => el.style.display = '');
                } else {
                    dropdown.classList.remove('active');
                }
                return;
            }

            if (overlay) {
                overlay.classList.add('active');
                mainContentElements.forEach(el => el.style.display = 'none');
                overlayGrid.innerHTML = '<div class="search-loading">Searching universe... 🪐</div>';
                if (queryDisplay) queryDisplay.textContent = `Results for "${query}"`;
            } else {
                dropdown.classList.add('active');
                dropdown.innerHTML = '<div class="search-loading">Searching universe... 🪐</div>';
            }

            timeout = setTimeout(async () => {
                try {
                    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=12`);
                    const data = await response.json();
                    
                    const target = overlay ? overlayGrid : dropdown;
                    
                    if (data.results.length === 0) {
                        target.innerHTML = '<div class="search-loading">No vibes found for this search. 🏜️</div>';
                        return;
                    }

                    target.innerHTML = '';
                    
                    data.results.forEach(track => {
                        const imgUrl = track.artworkUrl100.replace('100x100', '400x400');
                        
                        const item = document.createElement('div');
                        item.className = overlay ? 'search-card-premium' : 'search-result-item';
                        item.style.position = 'relative';
                        
                        if (overlay) {
                            item.innerHTML = `
                                <div class="search-card-img" style="background-image: url('${imgUrl}')">
                                    <div class="search-card-play">▶</div>
                                </div>
                                <div class="search-card-info">
                                    <div class="search-card-title">${track.trackName}</div>
                                    <div class="search-card-artist">${track.artistName}</div>
                                    <div class="search-card-meta">${track.collectionName || 'Single'}</div>
                                </div>
                                <div class="add-to-playlist-btn premium" title="Add to playlist">➕</div>
                                <div class="playlist-selector-modal"></div>
                            `;
                        } else {
                            item.innerHTML = `
                                <img src="${imgUrl}" class="search-result-img" alt="cover">
                                <div class="search-result-info">
                                    <div class="search-result-title">${track.trackName}</div>
                                    <div class="search-result-artist">${track.artistName}</div>
                                </div>
                                <div class="add-to-playlist-btn" title="Add to playlist">➕</div>
                                <div class="playlist-selector-modal"></div>
                            `;
                        }

                        const addBtn = item.querySelector('.add-to-playlist-btn');
                        const trackData = {
                            trackName: track.trackName,
                            artistName: track.artistName,
                            previewUrl: track.previewUrl,
                            artworkUrl100: imgUrl
                        };
                        handlePlaylistAdd(addBtn, trackData);

                        item.addEventListener('click', (e) => {
                            if (e.target.classList.contains('add-to-playlist-btn') || e.target.closest('.playlist-selector-modal')) return;
                            
                            document.querySelectorAll('audio').forEach(a => a.pause());
                            audioImg.src = imgUrl;
                            audioTitle.textContent = track.trackName;
                            audioArtist.textContent = track.artistName;
                            audioEl.src = track.previewUrl;
                            playerContainer.classList.add('show');
                            
                            if (!overlay) {
                                dropdown.classList.remove('active');
                                input.value = '';
                            }
                            
                            audioEl.play().catch(e => console.log("Autoplay prevented:", e));

                            if (lyricsContainer.classList.contains('show')) {
                                currentLyricsKey = ''; 
                                fetchLyrics(track.artistName, track.trackName);
                            }
                        });

                        target.appendChild(item);
                    });
                } catch (error) {
                    const target = overlay ? overlayGrid : dropdown;
                    target.innerHTML = '<div class="search-loading">Network error. Try again! 🔌</div>';
                }
            }, 500);
        });

        document.addEventListener('click', (e) => {
            if (dropdown && !container.contains(e.target)) {
                dropdown.classList.remove('active');
            }
            document.querySelectorAll('.playlist-selector-modal').forEach(m => {
                if (!m.contains(e.target) && !e.target.classList.contains('add-to-playlist-btn')) {
                    m.classList.remove('show');
                }
            });
        });
    });

    // Unified Playback & Playlist Addition for Landing Page Elements
    function setupLandingPageFunctionality() {
        const songItems = document.querySelectorAll('.music-card, .station-song-item');
        
        songItems.forEach(item => {
            // Inject Add to Playlist Button if not present
            if (!item.querySelector('.add-to-playlist-btn')) {
                const addBtnHtml = `
                    <div class="add-to-playlist-btn landing" title="Add to playlist">➕</div>
                    <div class="playlist-selector-modal"></div>
                `;
                item.insertAdjacentHTML('beforeend', addBtnHtml);
                
                const addBtn = item.querySelector('.add-to-playlist-btn.landing');
                const trackData = {
                    trackName: item.getAttribute('data-title') || item.querySelector('h4')?.textContent?.split(' ')?.[0] || 'Unknown Song',
                    artistName: item.getAttribute('data-artist') || item.querySelector('p')?.textContent || 'Unknown Artist',
                    previewUrl: item.getAttribute('data-src') || item.querySelector('source')?.getAttribute('src'),
                    artworkUrl100: item.getAttribute('data-img') || item.querySelector('.card-img, .song-thumb')?.style.backgroundImage.slice(5, -2)
                };

                if (trackData.previewUrl) {
                    handlePlaylistAdd(addBtn, trackData);
                } else {
                    addBtn.style.display = 'none'; // Hide if no source
                }
            }

            item.addEventListener('click', (e) => {
                if (e.target.tagName === 'A' || e.target.closest('a') || e.target.classList.contains('add-to-playlist-btn') || e.target.closest('.playlist-selector-modal') || e.target.tagName === 'AUDIO') return;

                const src = item.getAttribute('data-src') || item.querySelector('source')?.getAttribute('src');
                const title = item.getAttribute('data-title') || item.querySelector('h4')?.textContent?.split(' ')?.[0];
                const artist = item.getAttribute('data-artist') || item.querySelector('p')?.textContent;
                const img = item.getAttribute('data-img') || item.querySelector('.card-img, .song-thumb')?.style.backgroundImage.slice(5, -2);

                if (src) {
                    document.querySelectorAll('audio').forEach(a => a.pause());
                    audioImg.src = img;
                    audioTitle.textContent = title;
                    audioArtist.textContent = artist;
                    audioEl.src = src;
                    playerContainer.classList.add('show');
                    audioEl.play().catch(err => console.log("Playback failed:", err));

                    if (lyricsContainer.classList.contains('show')) {
                        currentLyricsKey = ''; 
                        fetchLyrics(artist, title);
                    }
                }
            });
        });
    }

    // Run setup
    setupLandingPageFunctionality();
});
