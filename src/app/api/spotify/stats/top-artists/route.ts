import { getTopArtists, getSpotifyToken } from "@/lib/spotify";
import { NextRequest, NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server'
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(request: NextRequest) {
  try {
    const { userId} = await auth()
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
    const key = `user:${userId}:top-artists:${validTimeRange}:${limit}`;
    const cachedData = await env.spotalyst.get(key);
    
    if (cachedData) {
      // Return cached data if available
      return NextResponse.json({ artists: JSON.parse(cachedData) });
    }
    
    // If no cached data, fetch from Spotify API
    const token = await getSpotifyToken(userId);
    const topArtists = await getTopArtists(token, validTimeRange, limit);
    
    const artists = topArtists.map((artist: any) => ({
      id: artist.id,
      name: artist.name,
      genres: artist.genres,
      popularity: artist.popularity,
      imageUrl: artist.images?.[0]?.url || null,
    }));
    
    // Store in KV
    await env.spotalyst.put(key, JSON.stringify(artists), { expirationTtl: 3600 }); // Cache for 1 hour
    
    return NextResponse.json({ artists });
  } catch (error) {
    console.error("Error fetching top artists:", error);
    return NextResponse.json(
      { error: "Failed to fetch top artists" },
      { status: 500 }
    );
  }
} 