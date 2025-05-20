/**
 * Track interface representing a Spotify track
 */
export interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  imageUrl: string | null;
  popularity?: number;
  spotifyUrl: string;
  previewUrl?: string | null;
  playedAt?: string;
  playCount?: number;
}

/**
 * Artist interface representing a Spotify artist
 */
export interface Artist {
  id: string;
  name: string;
  genres: string[];
  imageUrl: string | null;
  popularity: number;
}

/**
 * Time range options for Spotify stats
 */
export type TimeRange = 'short_term' | 'medium_term' | 'long_term';

/**
 * Playlist interface representing a Spotify playlist
 */
export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  trackCount: number;
  owner: string;
  public: boolean;
}

/**
 * Listening time data point
 */
export interface ListeningTimeData {
  date: string;
  minutes: number;
}

/**
 * API Response interfaces
 */
export interface ApiResponse {
  error?: string;
}

export interface TopTracksResponse extends ApiResponse {
  tracks: Track[];
}

export interface TopArtistsResponse extends ApiResponse {
  artists: Artist[];
}

export interface RecentlyPlayedResponse extends ApiResponse {
  tracks: Track[];
}

export interface PlaylistsResponse extends ApiResponse {
  playlists: Playlist[];
}

export interface RecommendationsResponse extends ApiResponse {
  tracks: Track[];
}

export interface ListeningTimeResponse extends ApiResponse {
  listeningTime: ListeningTimeData[];
} 