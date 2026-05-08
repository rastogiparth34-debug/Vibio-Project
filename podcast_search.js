document.addEventListener('DOMContentLoaded', () => {
    // Check Subscription First
    const isSubscribed = localStorage.getItem('vibio_subscribed') === 'true';
    const authOverlay = document.getElementById('podcast-auth-overlay');
    const mainContent = document.getElementById('podcast-main-content');
    
    if (!isSubscribed) {
        // User is NOT subscribed. Show overlay, hide content.
        if(authOverlay) {
            authOverlay.style.display = 'flex';
            // Update overlay text for clarity
            const h2 = authOverlay.querySelector('h2');
            if(h2) h2.textContent = 'Premium Podcasts Locked';
            const p = authOverlay.querySelector('p');
            if(p) p.textContent = 'Unlock the full library of premium podcasts by subscribing to Vibio Premium today.';
            const signUpBtn = authOverlay.querySelector('.btn-subscribe');
            if(signUpBtn) {
                signUpBtn.textContent = 'Subscribe Now';
                signUpBtn.href = 'index.html#subscribeNowBtn';
            }
        }
        if(mainContent) mainContent.style.filter = 'blur(15px)';
        if(mainContent) mainContent.style.pointerEvents = 'none';
        return; 
    } else {
        if(authOverlay) authOverlay.style.display = 'none';
        if(mainContent) mainContent.style.filter = 'none';
        if(mainContent) mainContent.style.pointerEvents = 'auto';
    }

    // --- Toast Notification ---
    const toastHtml = `<div id="pod-toast" class="toast-notification"></div>`;
    document.body.insertAdjacentHTML('beforeend', toastHtml);
    const toast = document.getElementById('pod-toast');

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // --- Audio Player Setup ---
    const playerHtml = `
        <div id="podcast-audio-player" style="position: fixed; bottom: -150px; left: 50%; transform: translateX(-50%); background: rgba(18,22,32,0.95); backdrop-filter: blur(25px); border: 1px solid rgba(192, 132, 252, 0.5); border-radius: 30px; padding: 15px 25px; display: flex; align-items: center; gap: 20px; z-index: 10000; transition: bottom 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 20px 50px rgba(0,0,0,0.6); width: 95%; max-width: 800px;">
            <img id="pod-audio-img" src="" style="width: 60px; height: 60px; border-radius: 12px; object-fit: cover; box-shadow: 0 5px 15px rgba(0,0,0,0.4);">
            <div style="flex: 0 1 200px; min-width: 150px;">
                <div id="pod-audio-title" style="font-weight: 700; color: #fff; font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Title</div>
                <div id="pod-audio-artist" style="color: #c084fc; font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Artist</div>
            </div>
            
            <div id="pod-audio-controls" style="flex: 1; display: flex; align-items: center; gap: 15px;">
                <button id="pod-play-pause" style="background: linear-gradient(135deg, #c084fc, #60a5fa); border: none; width: 45px; height: 45px; border-radius: 50%; color: white; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0;">▶</button>
                <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
                    <span id="pod-current-time" style="font-size: 0.75rem; color: #a2adcf; min-width: 35px;">0:00</span>
                    <input type="range" id="pod-seek-slider" value="0" max="100" style="flex: 1; -webkit-appearance: none; height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; outline: none; cursor: pointer;">
                    <span id="pod-total-duration" style="font-size: 0.75rem; color: #a2adcf; min-width: 35px;">0:00</span>
                </div>
            </div>

            <audio id="pod-audio-element"></audio>
            <button id="pod-audio-close" style="background: transparent; border: none; color: #ef4444; font-size: 1.5rem; cursor: pointer; margin-left: 10px;">✖</button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', playerHtml);

    const playerContainer = document.getElementById('podcast-audio-player');
    const audioEl = document.getElementById('pod-audio-element');
    const audioImg = document.getElementById('pod-audio-img');
    const audioTitle = document.getElementById('pod-audio-title');
    const audioArtist = document.getElementById('pod-audio-artist');
    const closeBtn = document.getElementById('pod-audio-close');
    const playPauseBtn = document.getElementById('pod-play-pause');
    const seekSlider = document.getElementById('pod-seek-slider');
    const currentTimeText = document.getElementById('pod-current-time');
    const durationText = document.getElementById('pod-total-duration');

    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    closeBtn.addEventListener('click', () => {
        audioEl.pause();
        playerContainer.style.bottom = '-150px';
    });

    playPauseBtn.addEventListener('click', () => {
        if (audioEl.paused) audioEl.play();
        else audioEl.pause();
    });

    audioEl.addEventListener('play', () => playPauseBtn.textContent = '⏸');
    audioEl.addEventListener('pause', () => playPauseBtn.textContent = '▶');
    
    audioEl.addEventListener('loadedmetadata', () => {
        seekSlider.max = Math.floor(audioEl.duration);
        durationText.textContent = formatTime(audioEl.duration);
    });

    audioEl.addEventListener('timeupdate', () => {
        if (!seekSlider.classList.contains('seeking')) {
            seekSlider.value = Math.floor(audioEl.currentTime);
            currentTimeText.textContent = formatTime(audioEl.currentTime);
            const progress = (audioEl.currentTime / audioEl.duration) * 100;
            seekSlider.style.background = `linear-gradient(to right, #c084fc ${progress}%, rgba(255, 255, 255, 0.1) ${progress}%)`;
        }
    });

    seekSlider.addEventListener('input', () => {
        seekSlider.classList.add('seeking');
        currentTimeText.textContent = formatTime(seekSlider.value);
        const progress = (seekSlider.value / seekSlider.max) * 100;
        seekSlider.style.background = `linear-gradient(to right, #c084fc ${progress}%, rgba(255, 255, 255, 0.1) ${progress}%)`;
    });

    seekSlider.addEventListener('change', () => {
        audioEl.currentTime = seekSlider.value;
        seekSlider.classList.remove('seeking');
    });

    // --- Search Logic ---
    const searchInput = document.getElementById('podcast-search-input');
    const searchResults = document.getElementById('podcast-search-results');
    let timeout = null;

    if (searchInput && searchResults) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            clearTimeout(timeout);
            
            if (query.length < 2) {
                searchResults.innerHTML = '';
                return;
            }

            searchResults.innerHTML = '<div style="color:var(--text-muted); padding:20px;">Searching podcasts... 🎙️</div>';

            timeout = setTimeout(async () => {
                try {
                    // Changed to podcastEpisode to get playable audio!
                    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=podcastEpisode&limit=8`);
                    const data = await response.json();
                    
                    if (data.results.length === 0) {
                        searchResults.innerHTML = '<div style="color:var(--text-muted); padding:20px;">No podcasts found. Try something else! 🏜️</div>';
                        return;
                    }

                    searchResults.innerHTML = '';
                    
                    data.results.forEach(pod => {
                        const imgUrl = pod.artworkUrl600 || pod.artworkUrl100 || pod.artworkUrl160;
                        const isFav = window.PodcastManager.isFavorite(pod.collectionId);
                        
                        const item = document.createElement('div');
                        item.className = 'podcast-card';
                        item.style.cursor = 'pointer';
                        item.innerHTML = `
                            <div class="podcast-cover" style="background-image: url('${imgUrl}'); position: relative;">
                                <div class="play-overlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; border-radius: 12px; font-size: 3rem; color: #fff;">▶</div>
                            </div>
                            <div class="podcast-info">
                                <h3 title="${pod.trackName}">${pod.trackName}</h3>
                                <p>${pod.collectionName}</p>
                            </div>
                            <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${pod.trackId || pod.collectionId}">
                                ${isFav ? '❤️ Favorited' : '🤍 Favorite Episode'}
                            </button>
                        `;

                        // Add hover effect for play button
                        const cover = item.querySelector('.podcast-cover');
                        item.addEventListener('mouseenter', () => cover.querySelector('.play-overlay').style.opacity = '1');
                        item.addEventListener('mouseleave', () => cover.querySelector('.play-overlay').style.opacity = '0');

                        // Handle Play Click (Whole Card)
                        item.addEventListener('click', (ev) => {
                            // Don't play if they clicked the favorite button
                            if (ev.target.closest('.fav-btn')) return;
                            
                            const audioUrl = pod.episodeUrl || pod.previewUrl;
                            
                            if (audioUrl) {
                                audioImg.src = imgUrl;
                                audioTitle.textContent = pod.trackName;
                                audioArtist.textContent = pod.collectionName;
                                audioEl.src = audioUrl;
                                
                                playerContainer.style.bottom = '20px';
                                const playPromise = audioEl.play();
                                if (playPromise !== undefined) {
                                    playPromise.catch(e => {
                                        console.error(e);
                                        showToast('Browser blocked autoplay. Click play in the player! 🔇');
                                    });
                                }
                            } else {
                                showToast('No audio available for this episode 🔇');
                            }
                        });

                        // Handle Favorite Button
                        const favBtn = item.querySelector('.fav-btn');
                        favBtn.addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            const uniqueId = pod.trackId || pod.collectionId;
                            if (window.PodcastManager.isFavorite(uniqueId)) {
                                window.PodcastManager.removeFavorite(uniqueId);
                                favBtn.innerHTML = '🤍 Favorite Episode';
                                favBtn.classList.remove('active');
                                showToast('Removed from favorites 🗑️');
                                renderFavorites();
                            } else {
                                const podData = {
                                    trackId: pod.trackId,
                                    collectionId: pod.collectionId,
                                    collectionName: pod.collectionName,
                                    artistName: pod.artistName || pod.collectionName,
                                    artworkUrl: imgUrl,
                                    feedUrl: pod.feedUrl,
                                    // Store audio URL for direct playback from favorites
                                    audioUrl: pod.episodeUrl || pod.previewUrl,
                                    trackName: pod.trackName
                                };
                                window.PodcastManager.addFavorite(podData);
                                favBtn.innerHTML = '❤️ Favorited';
                                favBtn.classList.add('active');
                                showToast('Added to favorites! 🎉');
                                renderFavorites();
                            }
                        });

                        searchResults.appendChild(item);
                    });
                } catch (error) {
                    searchResults.innerHTML = '<div style="color:var(--text-muted); padding:20px;">Network error. Try again! 🔌</div>';
                }
            }, 500);
        });
    }

    // --- Render Favorites ---
    function renderFavorites() {
        const grid = document.getElementById('favorite-podcasts-grid');
        if (!grid) return;

        const favs = window.PodcastManager.getFavorites();
        grid.innerHTML = '';

        if (favs.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted); background: rgba(255,255,255,0.02); border-radius: 20px; border: 1px dashed rgba(255,255,255,0.1);">You haven\'t favorited any podcasts yet. Search above to find your favorites! 🎙️</div>';
            return;
        }

        favs.forEach(pod => {
            const item = document.createElement('div');
            item.className = 'podcast-card bento-style';
            item.style.cursor = 'pointer';
            item.innerHTML = `
                <div class="podcast-cover" style="background-image: url('${pod.artworkUrl}'); position: relative;">
                    <div class="play-overlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; border-radius: 12px; font-size: 3rem; color: #fff;">▶</div>
                </div>
                <div class="podcast-info">
                    <h3 title="${pod.trackName || pod.collectionName}">${pod.trackName || pod.collectionName}</h3>
                    <p>${pod.collectionName}</p>
                </div>
                <button class="remove-fav-btn" data-id="${pod.trackId || pod.collectionId}" title="Remove">✖</button>
            `;

            // Hover effect for favorites
            const cover = item.querySelector('.podcast-cover');
            item.addEventListener('mouseenter', () => cover.querySelector('.play-overlay').style.opacity = '1');
            item.addEventListener('mouseleave', () => cover.querySelector('.play-overlay').style.opacity = '0');

            // Play Favorite
            item.addEventListener('click', (ev) => {
                if (ev.target.closest('.remove-fav-btn')) return;

                if (pod.audioUrl) {
                    audioImg.src = pod.artworkUrl;
                    audioTitle.textContent = pod.trackName || pod.collectionName;
                    audioArtist.textContent = pod.collectionName;
                    audioEl.src = pod.audioUrl;
                    
                    playerContainer.style.bottom = '20px';
                    audioEl.play().catch(e => showToast('Click play to start! 🔇'));
                } else {
                    showToast('This podcast show needs to be searched to play specific episodes 🎙️');
                }
            });

            const removeBtn = item.querySelector('.remove-fav-btn');
            removeBtn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const uniqueId = pod.trackId || pod.collectionId;
                window.PodcastManager.removeFavorite(uniqueId);
                showToast('Removed from favorites 🗑️');
                renderFavorites();
            });

            grid.appendChild(item);
        });
    }

    // Initial render
    renderFavorites();
});
