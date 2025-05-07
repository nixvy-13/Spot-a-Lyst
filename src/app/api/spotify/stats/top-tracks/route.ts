import { getTopTracks, getSpotifyToken } from "@/lib/spotify";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";


export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("time_range") || "medium_term";
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const validTimeRange = timeRange === 'short_term' || timeRange === 'medium_term' || timeRange === 'long_term' 
      ? timeRange 
      : 'medium_term';
      
    // Check KV for cached data
    const { env } = getCloudflareContext();
    const key = `user:${userId}:top-tracks:${validTimeRange}:${limit}`;
    const cachedData = await env.spotalyst.get(key);
    
    if (cachedData) {
      // Return cached data if available
      return NextResponse.json({ tracks: JSON.parse(cachedData) });
    }
    
    // If no cached data, fetch from Spotify API
    const token = await getSpotifyToken(userId);
    const topTracks = await getTopTracks(token, validTimeRange, limit);
    
    const tracks = topTracks.map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map((artist: any) => artist.name).join(", "),
      album: track.album.name,
      popularity: track.popularity,
      duration: track.duration_ms,
      previewUrl: track.preview_url,
      spotifyUrl: track.external_urls.spotify,
      imageUrl: track.album.images?.[0]?.url || null,
    }));
    
    // Store in KV
    await env.spotalyst.put(key, JSON.stringify(tracks), { expirationTtl: 3600 }); // Cache for 1 hour
    
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Error fetching top tracks:", error);
    return NextResponse.json(
      { error: "Failed to fetch top tracks" },
      { status: 500 }
    );
  }
} 