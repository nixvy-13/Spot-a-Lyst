import { clerkClient } from '@clerk/nextjs/server';

interface SpotifyPagingObject<T> {
    href: string;
    items: T[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
}

interface SpotifyTrack {
    id: string;
    name: string;
    artists: { id: string; name: string; uri: string }[];
    album: {
        id: string;
        name: string;
        images: { url: string; height: number; width: number }[];
        uri: string;
    };
    duration_ms: number;
    popularity: number;
    uri: string;
}

interface SpotifyArtist {
    id: string;
    name: string;
    genres: string[];
    images: { url: string; height: number; width: number }[];
    popularity: number;
    uri: string;
}

interface SpotifyPlaylistTrack {
    added_at: string;
    track: SpotifyTrack;
}

interface SpotifyPlayHistory {
    track: SpotifyTrack;
    played_at: string;
    context: {
        type: string;
        uri: string;
    };
}

// Interface for Spotify search responses
interface SpotifySearchResponse<T> {
  artists?: { items: T[] };
  albums?: { items: T[] };
  tracks?: { items: T[] };
}

export const getTopTracks = async (
    token: string, 
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', 
    limit = 10
) => {
    try {
        const response = await fetch(
            `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
    );
    if (!response.ok) {
            throw new Error(`Error getting top tracks: ${response.status}`);
        }
        const data = await response.json() as SpotifyPagingObject<SpotifyTrack>;
        return data.items;
    } catch (error) {
            console.error('Error getting top tracks:', error);
            throw error;
    }
};
export const getTopArtists = async (
    token: string, 
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', 
    limit = 10
) => {
    try {
        const response = await fetch(
            `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        );
    if (!response.ok) {
        throw new Error(`Error getting top artists: ${response.status}`);
    }
        const data = await response.json() as SpotifyPagingObject<SpotifyArtist>;
        return data.items;
    } catch (error) {
        console.error('Error getting top artists:', error);
        throw error;
    }
};
export const getRecentlyPlayed = async (token: string, limit = 20) => {
    try {
        const response = await fetch(
            `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        );
        if (!response.ok) {
            throw new Error(`Error getting recently played tracks: ${response.status}`);
        }
        const data = await response.json() as SpotifyPagingObject<SpotifyPlayHistory>;
        return data.items;
    } catch (error) {
        console.error('Error getting recently played tracks:', error);
        throw error;
    }
};
export const getUserPlaylists = async (token: string, limit = 20) => {
    try {
        const response = await fetch(
            `https://api.spotify.com/v1/me/playlists?limit=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        );
        if (!response.ok) {
            throw new Error(`Error getting user playlists: ${response.status}`);
        }
        const data = await response.json() as SpotifyPagingObject<any>;
        return data.items;
        } catch (error) {
            console.error('Error getting user playlists:', error);
            throw error;
        }
};

export const getPlaylistTracks = async (token: string, playlistId: string) => {
    try {
        const response = await fetch(
            `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
            {
                headers: {
                'Authorization': `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Error getting playlist tracks: ${response.status}`);
        }

        const data = await response.json() as SpotifyPagingObject<SpotifyPlaylistTrack>;
        return data.items;
        } catch (error) {
            console.error('Error getting playlist tracks:', error);
            throw error;
        }
};

export const getSpotifyToken = async (userId: string): Promise<string> => {
    try {
        const provider = "spotify";
        const clerk = await clerkClient();
        const clerkResponse = await clerk.users.getUserOauthAccessToken(
            userId,
            provider
        );
        const accessToken = clerkResponse.data[0]?.token;
        
        if (!accessToken) {
            throw new Error("No Spotify access token found for user");
        }
        
        return accessToken;
    } catch (error) {
        console.error("Error getting Spotify token:", error);
        throw error;
    }
};

export const fetchUserRecentlyPlayedTracks = async (userId: string, limit: number = 20) => {
  try {
    const token = await getSpotifyToken(userId);
    const recentTracks = await getRecentlyPlayed(token, limit);
    
    return {
      tracks: recentTracks.map((item: any) => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists.map((artist: any) => artist.name).join(", "),
        album: item.track.album.name,
        playedAt: item.played_at,
        duration: item.track.duration_ms,
        spotifyUrl: item.track.external_urls.spotify,
        imageUrl: item.track.album.images?.[0]?.url || null,
      })),
    };
  } catch (error) {
    console.error("Error fetching recently played tracks:", error);
    throw error;
  }
};

/**
 * Search for artist details on Spotify
 */
export async function searchSpotifyArtists(accessToken: string, artistNames: string[]) {
  const artistDetails = [];
  
  for (const name of artistNames) {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          next: { tags: ['spotifyArtists'] }
        }
      );
      
      const data = await response.json() as SpotifySearchResponse<{
        name: string;
        id: string;
        genres: string[];
        popularity: number;
        images?: { url: string }[];
        external_urls: { spotify: string };
      }>;
      
      if (data.artists && data.artists.items.length > 0) {
        const artist = data.artists.items[0];
        artistDetails.push({
          name: artist.name,
          id: artist.id,
          genres: artist.genres,
          popularity: artist.popularity,
          imageUrl: artist.images?.[0]?.url || null,
          spotifyUrl: artist.external_urls.spotify
        });
      } else {
        // Artist not found, return only the name
        artistDetails.push({ name, notFound: true });
      }
    } catch (error) {
      console.error(`Error searching for artist ${name}:`, error);
      artistDetails.push({ name, error: true });
    }
  }
  
  return artistDetails;
}

/**
 * Search for album details on Spotify
 */
export async function searchSpotifyAlbums(accessToken: string, albumNames: string[]) {
  const albumDetails = [];
  
  for (const name of albumNames) {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=album&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          next: { tags: ['spotifyAlbums'] }
        }
      );
      
      const data = await response.json() as SpotifySearchResponse<{
        name: string;
        id: string;
        artists: { name: string }[];
        release_date: string;
        images?: { url: string }[];
        external_urls: { spotify: string };
        total_tracks: number;
      }>;
      
      if (data.albums && data.albums.items.length > 0) {
        const album = data.albums.items[0];
        albumDetails.push({
          name: album.name,
          id: album.id,
          artist: album.artists.map((a) => a.name).join(', '),
          releaseDate: album.release_date,
          imageUrl: album.images?.[0]?.url || null,
          spotifyUrl: album.external_urls.spotify,
          totalTracks: album.total_tracks
        });
      } else {
        // Album not found, return only the name
        albumDetails.push({ name, notFound: true });
      }
    } catch (error) {
      console.error(`Error searching for album ${name}:`, error);
      albumDetails.push({ name, error: true });
    }
  }
  
  return albumDetails;
}

/**
 * Search for track details on Spotify
 */
export async function searchSpotifyTracks(accessToken: string, trackNames: {name: string, artist?: string}[]) {
  const trackDetails = [];
  
  for (const track of trackNames) {
    try {
      let query = track.name;
      if (track.artist) {
        query += ` artist:${track.artist}`;
      }
      
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          next: { tags: ['spotifyTracks'] }
        }
      );
      
      const data = await response.json() as SpotifySearchResponse<{
        name: string;
        id: string;
        artists: { name: string }[];
        album: { name: string; images?: { url: string }[] };
        popularity: number;
        duration_ms: number;
        preview_url: string | null;
        external_urls: { spotify: string };
      }>;
      
      if (data.tracks && data.tracks.items.length > 0) {
        const trackInfo = data.tracks.items[0];
        trackDetails.push({
          name: trackInfo.name,
          id: trackInfo.id,
          artist: trackInfo.artists.map((a) => a.name).join(', '),
          album: trackInfo.album.name,
          popularity: trackInfo.popularity,
          duration: trackInfo.duration_ms,
          previewUrl: trackInfo.preview_url,
          spotifyUrl: trackInfo.external_urls.spotify,
          imageUrl: trackInfo.album.images?.[0]?.url || null
        });
      } else {
        // Track not found, return only the name
        trackDetails.push({ name: track.name, artist: track.artist, notFound: true });
      }
    } catch (error) {
      console.error(`Error searching for track ${track.name}:`, error);
      trackDetails.push({ name: track.name, artist: track.artist, error: true });
    }
  }
  
  return trackDetails;
}

/**
 * Extract JSON data from a Markdown response
 */
export function extractJsonFromMarkdown(text: string): string {
  // Remove Markdown code blocks
  if (text.includes('```')) {
    // If the text contains code blocks, try to extract just the content
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      return jsonMatch[1].trim();
    }
  }
  
  // If there are no code blocks or we couldn't extract them, return the original cleaned text
  return text.replace(/```json|```/g, '').trim();
}