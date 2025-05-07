import { 
  Artist, 
  Track, 
  TimeRange, 
  TopTracksResponse, 
  TopArtistsResponse, 
  RecentlyPlayedResponse,
  PlaylistsResponse,
  RecommendationsResponse,
  Playlist
} from '@/types/spotify';

/**
 * Client-side API client for Spotify services
 */
export const spotifyApi = {
  /**
   * Get top tracks for the current user
   */
  getTopTracks: async (timeRange: TimeRange = 'medium_term', limit: number = 10): Promise<Track[]> => {
    const response = await fetch(`/api/spotify/stats/top-tracks?time_range=${timeRange}&limit=${limit}`);
    const data = await response.json() as TopTracksResponse;
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data.tracks;
  },
  
  /**
   * Get top artists for the current user
   */
  getTopArtists: async (timeRange: TimeRange = 'medium_term', limit: number = 10): Promise<Artist[]> => {
    const response = await fetch(`/api/spotify/stats/top-artists?time_range=${timeRange}&limit=${limit}`);
    const data = await response.json() as TopArtistsResponse;
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data.artists;
  },
  
  /**
   * Get recently played tracks for the current user
   */
  getRecentlyPlayed: async (limit: number = 20): Promise<Track[]> => {
    const response = await fetch(`/api/spotify/stats/recently-played?limit=${limit}`);
    const data = await response.json() as RecentlyPlayedResponse;
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data.tracks;
  },
  
  /**
   * Get playlists for the current user
   */
  getPlaylists: async (limit: number = 20): Promise<Playlist[]> => {
    const response = await fetch(`/api/spotify/playlists?limit=${limit}`);
    const data = await response.json() as PlaylistsResponse;
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data.playlists;
  },
  
  /**
   * Get recommendations based on parameters
   */
  getRecommendations: async (params: Record<string, any>): Promise<Track[]> => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`/api/spotify/recommendations?${queryString}`);
    const data = await response.json() as RecommendationsResponse;
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data.tracks;
  },

  /**
   * Convert Spotify playlist to YouTube format
   */
  convertPlaylistToYoutube: async (spotifyPlaylistId: string, playlistName: string): Promise<{youtubeImportUrl: string, trackCount: number}> => {
    const response = await fetch('/api/spotify/playlist-to-youtube', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spotifyPlaylistId,
        playlistName,
      }),
    });
    
    const data = await response.json() as { 
      youtubeImportUrl?: string; 
      trackCount?: number; 
      error?: string 
    };
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    if (data.youtubeImportUrl && data.trackCount) {
      return {
        youtubeImportUrl: data.youtubeImportUrl,
        trackCount: data.trackCount,
      };
    } else {
      throw new Error('Invalid response format');
    }
  }
}; 