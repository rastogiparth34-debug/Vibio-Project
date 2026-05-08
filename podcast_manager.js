const PodcastManager = {
    key: 'vibio_favorite_podcasts',

    getFavorites: function() {
        const data = localStorage.getItem(this.key);
        return data ? JSON.parse(data) : [];
    },

    saveFavorites: function(podcasts) {
        localStorage.setItem(this.key, JSON.stringify(podcasts));
    },

    // Use a unique ID: trackId for episodes, collectionId for shows
    getUniqueId: function(podcastData) {
        return podcastData.trackId || podcastData.collectionId;
    },

    addFavorite: function(podcastData) {
        const favorites = this.getFavorites();
        const uniqueId = this.getUniqueId(podcastData);
        
        const exists = favorites.some(p => this.getUniqueId(p) === uniqueId);
        if (exists) return false;

        favorites.push(podcastData);
        this.saveFavorites(favorites);
        return true;
    },

    removeFavorite: function(uniqueId) {
        let favorites = this.getFavorites();
        favorites = favorites.filter(p => this.getUniqueId(p) !== uniqueId);
        this.saveFavorites(favorites);
        return true;
    },
    
    isFavorite: function(uniqueId) {
        const favorites = this.getFavorites();
        return favorites.some(p => this.getUniqueId(p) === uniqueId);
    }
};

window.PodcastManager = PodcastManager;
