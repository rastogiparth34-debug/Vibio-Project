const PlaylistManager = {
    key: 'vibio_playlists',

    // Get all playlists
    getPlaylists: function() {
        const data = localStorage.getItem(this.key);
        return data ? JSON.parse(data) : [];
    },

    // Get a specific playlist by ID
    getPlaylistById: function(id) {
        const playlists = this.getPlaylists();
        return playlists.find(p => p.id === id);
    },

    // Save all playlists
    savePlaylists: function(playlists) {
        localStorage.setItem(this.key, JSON.stringify(playlists));
    },

    // Create a new playlist
    createPlaylist: function(name, description, coverUrl, privacy, genre) {
        const playlists = this.getPlaylists();
        const newPlaylist = {
            id: 'pl_' + Date.now().toString(36) + Math.random().toString(36).substr(2),
            name: name || 'My Playlist',
            description: description || '',
            coverUrl: coverUrl || 'https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
            privacy: privacy || 'Public',
            genre: genre || 'Mixed',
            createdAt: new Date().toISOString(),
            songs: [] // Array of song objects: { trackName, artistName, previewUrl, artworkUrl100 }
        };
        
        playlists.push(newPlaylist);
        this.savePlaylists(playlists);
        return newPlaylist;
    },

    // Add a song to a playlist
    addSong: function(playlistId, songData) {
        const playlists = this.getPlaylists();
        const playlistIndex = playlists.findIndex(p => p.id === playlistId);
        
        if (playlistIndex === -1) return false;
        
        // Prevent duplicates
        const exists = playlists[playlistIndex].songs.some(s => s.previewUrl === songData.previewUrl);
        if (exists) return false;

        playlists[playlistIndex].songs.push(songData);
        this.savePlaylists(playlists);
        return true;
    },

    // Remove a song from a playlist
    removeSong: function(playlistId, previewUrl) {
        const playlists = this.getPlaylists();
        const playlistIndex = playlists.findIndex(p => p.id === playlistId);
        
        if (playlistIndex === -1) return false;

        playlists[playlistIndex].songs = playlists[playlistIndex].songs.filter(s => s.previewUrl !== previewUrl);
        this.savePlaylists(playlists);
        return true;
    },

    // Delete an entire playlist
    deletePlaylist: function(playlistId) {
        let playlists = this.getPlaylists();
        const initialLength = playlists.length;
        playlists = playlists.filter(p => p.id !== playlistId);
        
        if (playlists.length < initialLength) {
            this.savePlaylists(playlists);
            return true;
        }
        return false;
    }
};

// Make it globally available
window.PlaylistManager = PlaylistManager;
