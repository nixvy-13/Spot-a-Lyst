import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSpotifyToken } from '@/lib/spotify';
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get access to Cloudflare KV
    const { env } = getCloudflareContext();
    
    // Get token for Spotify API
    const token = await getSpotifyToken(userId);
    
    // Call each stats endpoint with force=true to refresh cache
    const timeRanges = ['short_term', 'medium_term', 'long_term'];
    const limits = [10, 20, 50];
    const days = [7, 14, 30, 90];
    
    // Create a list of all API requests we need to make
    const requests = [];
    
    // Top tracks endpoints
    for (const timeRange of timeRanges) {
      for (const limit of limits) {
        requests.push(
          fetch(`${request.nextUrl.origin}/api/spotify/stats/top-tracks?time_range=${timeRange}&limit=${limit}&force=true`, {
            headers: { 'Cookie': request.headers.get('cookie') || '' }
          })
        );
      }
    }
    
    // Top artists endpoints
    for (const timeRange of timeRanges) {
      for (const limit of limits) {
        requests.push(
          fetch(`${request.nextUrl.origin}/api/spotify/stats/top-artists?time_range=${timeRange}&limit=${limit}&force=true`, {
            headers: { 'Cookie': request.headers.get('cookie') || '' }
          })
        );
      }
    }
    
    // Recently played endpoints
    for (const limit of limits) {
      requests.push(
        fetch(`${request.nextUrl.origin}/api/spotify/stats/recently-played?limit=${limit}&force=true`, {
          headers: { 'Cookie': request.headers.get('cookie') || '' }
        })
      );
    }
    
    // Listening time endpoints
    for (const day of days) {
      requests.push(
        fetch(`${request.nextUrl.origin}/api/spotify/stats/listening-time?days=${day}&force=true`, {
          headers: { 'Cookie': request.headers.get('cookie') || '' }
        })
      );
    }
    
    // Recommendations endpoint
    requests.push(
      fetch(`${request.nextUrl.origin}/api/spotify/recommendations?force=true`, {
        headers: { 'Cookie': request.headers.get('cookie') || '' }
      })
    );
    
    // Execute all requests in parallel
    await Promise.all(requests);
    
    // Delete user KV keys pattern to force complete refresh
    // but preserve the listening-time data which should be incremental
    const keys = await env.playlister.list({ prefix: `user:${userId}:` });
    const keysToDelete = keys.keys.filter(key => !key.name.includes('listening-time'));
    await Promise.all(keysToDelete.map(key => env.playlister.delete(key.name)));
    
    return NextResponse.json({ 
      success: true,
      message: 'All Spotify stats refreshed successfully'
    });
  } catch (error: any) {
    console.error('Error refreshing Spotify stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to refresh Spotify stats' },
      { status: 500 }
    );
  }
} 