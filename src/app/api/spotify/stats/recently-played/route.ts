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
    const forceRefresh = searchParams.get("force") === "true";
    
    // Check KV for cached data
    const { env } = getCloudflareContext();
    const key = `user:${userId}:recently-played:${limit}`;
    
    // Only check cache if not forcing refresh
    if (!forceRefresh) {
      const cachedData = await env.kv.get(key);
      
      if (cachedData) {
        // Return cached data if available
        return NextResponse.json({ tracks: JSON.parse(cachedData) });
      }
    }
    
    // If no cached data or forcing refresh, fetch from Spotify API
    const token = await getSpotifyToken(userId);
    const recentTracks = await getRecentlyPlayed(token, limit)
    
    // Map the tracks and prepare for grouping
    const tracksArray = recentTracks.map((item: any) => ({
      id: item.track.id,
      name: item.track.name,
      artist: item.track.artists.map((artist: any) => artist.name).join(", "),
      album: item.track.album.name,
      playedAt: item.played_at,
      duration: item.track.duration_ms,
      spotifyUrl: item.track.external_urls.spotify,
      imageUrl: item.track.album.images?.[0]?.url || null,
    }));
    
    // Group tracks by ID and count occurrences
    const groupedTracks = tracksArray.reduce((acc: any[], track) => {
      const existingTrack = acc.find(t => t.id === track.id);
      
      if (existingTrack) {
        existingTrack.playCount = (existingTrack.playCount || 1) + 1;
        // Keep the most recent played date
        if (track.playedAt > existingTrack.playedAt) {
          existingTrack.playedAt = track.playedAt;
        }
      } else {
        acc.push({
          ...track,
          playCount: 1
        });
      }
      
      return acc;
    }, []);
    
    // Sort by most recently played
    groupedTracks.sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
    
    // Store in KV
    await env.kv.put(key, JSON.stringify(groupedTracks), { expirationTtl: 3600 }); // Cache for 1 hour
    
    return NextResponse.json({ tracks: groupedTracks });
  } catch (error) {
    console.error("Error fetching recently played tracks:", error);
    return NextResponse.json(
      { error: "Failed to fetch recently played tracks" },
      { status: 500 }
    );
  }
} 