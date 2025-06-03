import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSpotifyToken, getRecentlyPlayed } from '@/lib/spotify';
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the date range from query params
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const forceRefresh = searchParams.get("force") === "true";

    // Get access to Cloudflare KV
    const { env } = getCloudflareContext();
    
    // Always get the existing data from KV store - we need to preserve it
    const kvKey = `user:${userId}:listening-time`;
    let storedData = await env.kv.get(kvKey, { type: "json" }) as Record<string, number> || {};

    // Get token for Spotify API
    const token = await getSpotifyToken(userId);
    
    // Fetch more recent history if forcing refresh
    // Use a larger limit to get more data when explicitly refreshing
    const limit = forceRefresh ? 50 : 20;
    const recentTracks = await getRecentlyPlayed(token, limit);
    
    // Process the recently played tracks
    const newPlaytimeData = processPlaytimeData(recentTracks);
    
    // Merge the new data with existing data
    const mergedData = mergePlaytimeData(storedData, newPlaytimeData);
    
    // Store the merged data back in KV - don't set expiration so it persists
    await env.kv.put(kvKey, JSON.stringify(mergedData));
    
    // Filter the data for the requested time range
    const filteredData = filterDataByDays(mergedData, days);
    
    // Format data for the response
    const formattedData = formatDataForResponse(filteredData);
    
    return NextResponse.json({ 
      listeningTime: formattedData 
    });
  } catch (error: any) {
    console.error('Error in listening time API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch listening time data' },
      { status: 500 }
    );
  }
}

/**
 * Process playtime data from recently played tracks
 */
function processPlaytimeData(recentTracks: any[]): Record<string, number> {
  const playtimeByDay: Record<string, number> = {};

  recentTracks.forEach(item => {
    const playedAt = new Date(item.played_at);
    const dateKey = playedAt.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const durationMs = item.track.duration_ms || 0;
    
    // Add duration to the appropriate day
    if (!playtimeByDay[dateKey]) {
      playtimeByDay[dateKey] = 0;
    }
    playtimeByDay[dateKey] += durationMs;
  });

  return playtimeByDay;
}

/**
 * Merge new playtime data with existing data
 */
function mergePlaytimeData(
  existingData: Record<string, number>,
  newData: Record<string, number>
): Record<string, number> {
  const mergedData = { ...existingData };
  
  // Add new data to existing data
  Object.entries(newData).forEach(([date, duration]) => {
    if (mergedData[date]) {
      mergedData[date] += duration;
    } else {
      mergedData[date] = duration;
    }
  });
  
  return mergedData;
}

/**
 * Filter data for the specified number of days
 */
function filterDataByDays(
  data: Record<string, number>,
  days: number
): Record<string, number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
  
  return Object.entries(data)
    .filter(([date]) => date >= cutoffDateStr)
    .reduce((filtered, [date, duration]) => {
      filtered[date] = duration;
      return filtered;
    }, {} as Record<string, number>);
}

/**
 * Format data for response (convert to minutes and sort by date)
 */
function formatDataForResponse(data: Record<string, number>) {
  return Object.entries(data)
    .map(([date, durationMs]) => ({
      date,
      minutes: Math.round(durationMs / 60000) // Convert ms to minutes
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
} 