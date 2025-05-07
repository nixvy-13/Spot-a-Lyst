import { getRecentlyPlayed, getSpotifyToken } from "@/lib/spotify";
import { NextRequest, NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    
    // Check KV for cached data
    const { env } = getCloudflareContext();
    const key = `user:${userId}:recently-played:${limit}`;
    const cachedData = await env.playlister.get(key);
    
    if (cachedData) {
      // Return cached data if available
      return NextResponse.json({ tracks: JSON.parse(cachedData) });
    }
    
    // If no cached data, fetch from Spotify API
    const token = await getSpotifyToken(userId);
    const recentTracks = await getRecentlyPlayed(token, limit)
    
    const tracks = recentTracks.map((item: any) => ({
      id: item.track.id,
      name: item.track.name,
      artist: item.track.artists.map((artist: any) => artist.name).join(", "),
      album: item.track.album.name,
      playedAt: item.played_at,
      duration: item.track.duration_ms,
      spotifyUrl: item.track.external_urls.spotify,
      imageUrl: item.track.album.images?.[0]?.url || null,
    }));
    
    // Store in KV
    await env.playlister.put(key, JSON.stringify(tracks), { expirationTtl: 3600 }); // Cache for 1 hour
    
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Error fetching recently played tracks:", error);
    return NextResponse.json(
      { error: "Failed to fetch recently played tracks" },
      { status: 500 }
    );
  }
} 