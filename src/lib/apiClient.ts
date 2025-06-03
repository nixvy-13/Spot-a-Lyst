import { 
  Artist, 
  Track, 
  TimeRange, 
  TopTracksResponse, 
  TopArtistsResponse, 
  RecentlyPlayedResponse,
  RecommendationsResponse,
  ListeningTimeResponse,
  ListeningTimeData
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
   * Get AI-powered recommendations and insights
   */
  getAIRecommendations: async (force: boolean = false): Promise<{
    patterns: string[];
    recommendedArtists: any[];
    recommendedAlbums: any[];
    recommendedTracks: any[];
    recommendedGenres: string[];
    roast: string;
    personalityReading: string;
    userTaste: any;
  }> => {
    const url = force 
      ? '/api/spotify/recommendations?force=true'
      : '/api/spotify/recommendations';
      
    const response = await fetch(url);
    const data = await response.json() as {
      patterns: string[];
      recommendedArtists: any[];
      recommendedAlbums: any[];
      recommendedTracks: any[];
      recommendedGenres: string[];
      roast: string;
      personalityReading: string;
      userTaste: any;
      error?: string;
    };
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  },

  /**
   * Get listening time data grouped by days
   */
  getListeningTime: async (days: number = 30): Promise<ListeningTimeData[]> => {
    const response = await fetch(`/api/spotify/stats/listening-time?days=${days}`);
    const data = await response.json() as ListeningTimeResponse;
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data.listeningTime;
  },

  /**
   * Refresh all Spotify stats and rebuild KV entries
   */
  refreshSpotifyStats: async (): Promise<void> => {
    const response = await fetch('/api/spotify/stats/refresh', {
      method: 'POST'
    });
    
    const data = await response.json() as { success?: boolean; error?: string };
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return;
  },

  /**
   * Generate share image from recommendations data
   */
  generateShareImage: async (data: {
    patterns: string[];
    roast: string;
    personalityReading: string;
    recommendedGenres: string[];
    userTaste: any;
    userInfo: {
      name: string;
      imageUrl?: string;
    };
  }): Promise<Blob> => {
    const response = await fetch('/api/spotify/generate-recomendations-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate image');
    }
    
    return response.blob();
  },

  /**
   * Get listening time data for the user
   */
  getListeningTimeForUser: async (): Promise<ListeningTimeData[]> => {
    const response = await fetch('/api/spotify/stats/listening-time-for-user');
    const data = await response.json() as ListeningTimeResponse;
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data.listeningTime;
  },

  /**
   * Generate profile image from user stats
   */
  generateProfileImage: async (data: {
    userInfo: {
      name: string;
      email?: string;
      imageUrl?: string;
    };
    topTracks: Array<{
      name: string;
      artist: string;
      imageUrl?: string;
      popularity: number;
    }>;
    topArtists: Array<{
      name: string;
      genres: string[];
      imageUrl?: string;
      popularity: number;
    }>;
    recentTracks: Array<{
      name: string;
      artist: string;
      imageUrl?: string;
      playedAt?: string;
    }>;
    timeRange: 'short_term' | 'medium_term' | 'long_term';
  }): Promise<Blob> => {
    const response = await fetch('/api/spotify/generate-profile-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate profile image');
    }
    
    return response.blob();
  },
}; 