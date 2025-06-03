import { getTopArtists, getTopTracks, searchSpotifyArtists, searchSpotifyAlbums, searchSpotifyTracks, searchSpotifyTracksByTitle, extractJsonFromMarkdown, getSpotifyToken, getRecentlyPlayed } from "@/lib/spotify";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from 'openai';
import { auth } from "@clerk/nextjs/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Initialize OpenAI with OpenRouter configuration
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || "",
  defaultHeaders: {
    'HTTP-Referer': process.env.SITE_URL || 'https://spot-a-lyst.nixvy.ninja/',
    'X-Title': 'Spot-a-Lyst',
  },
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Parse query parameters
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get("force") === "true" || url.searchParams.get("regenerate") === "true";
    
    // Check KV for cached data
    const { env } = getCloudflareContext();
    const key = `user:${userId}:recommendations`;
    
    // Only check cache if not forcing refresh
    if (!forceRefresh) {
      const cachedData = await env.kv.get(key);
      
      if (cachedData) {
        // Return cached data if available
        return NextResponse.json(JSON.parse(cachedData));
      }
    }
    
    // If no cached data or force refresh, generate new recommendations
    const token = await getSpotifyToken(userId);
    const [topTracks, topArtists, topArtistsLongTerm, topTracksLongTerm, topTracksShortTerm, topArtistsShortTerm, recentlyPlayed] = await Promise.all([
      getTopTracks(token, "medium_term", 10),
      getTopArtists(token, "medium_term", 10),
      getTopArtists(token, "long_term", 10),
      getTopTracks(token, "long_term", 10),
      getTopTracks(token, "short_term", 10),
      getTopArtists(token, "short_term", 10),
      getRecentlyPlayed(token, 50)
    ]);

    

    const allGenres = topArtists.flatMap((artist: any) => artist.genres || []);
    const uniqueGenres = [...new Set(allGenres)].slice(0, 5) as string[];

    const userTasteInfo = {
      topArtists: topArtists.slice(0, 10).map((artist: any) => ({
        name: artist.name,
        genres: artist.genres,
        popularity: artist.popularity,
        followers: artist.followers?.total || 0
      })),
      topTracks: topTracks.slice(0, 10).map((track: any) => ({
        name: track.name,
        artist: track.artists.map((a: any) => a.name).join(", "),
        popularity: track.popularity,
        duration: track.duration_ms,
        explicit: track.explicit,
        danceability: track.danceability,
        energy: track.energy,
        valence: track.valence
      })),
      topArtistsLongTerm: topArtistsLongTerm.slice(0, 10).map((artist: any) => ({
        name: artist.name,
        genres: artist.genres,
        popularity: artist.popularity,
        followers: artist.followers?.total || 0
      })),
      topTracksLongTerm: topTracksLongTerm.slice(0, 10).map((track: any) => ({
        name: track.name,
        artist: track.artists.map((a: any) => a.name).join(", "),
        popularity: track.popularity,
        duration: track.duration_ms,
        explicit: track.explicit,
        danceability: track.danceability,
        energy: track.energy,
        valence: track.valence
      })),
      topArtistsShortTerm: topArtistsShortTerm.slice(0, 10).map((artist: any) => ({
        name: artist.name,
        genres: artist.genres,
        popularity: artist.popularity,
        followers: artist.followers?.total || 0
      })),
      topTracksShortTerm: topTracksShortTerm.slice(0, 10).map((track: any) => ({
        name: track.name,
        artist: track.artists.map((a: any) => a.name).join(", "),
        popularity: track.popularity,
        duration: track.duration_ms,
        explicit: track.explicit,
        danceability: track.danceability,
        energy: track.energy,
        valence: track.valence
      })),
      recentlyPlayed: recentlyPlayed.slice(0, 20).map((item: any) => ({
        name: item.track.name,
        artist: item.track.artists.map((a: any) => a.name).join(", "),
        playedAt: item.played_at,
        popularity: item.track.popularity,
        explicit: item.track.explicit
      }))
    };
    let aiInsights;
    
    const prompt = `
      As a music expert AI with a witty personality, analyze this user's comprehensive listening preferences:
      
      Top Artists (Medium Term - Last 6 months): ${JSON.stringify(userTasteInfo.topArtists)}
      Top Tracks (Medium Term - Last 6 months): ${JSON.stringify(userTasteInfo.topTracks)}
      
      Top Artists (Long Term - Several years): ${JSON.stringify(userTasteInfo.topArtistsLongTerm)}
      Top Tracks (Long Term - Several years): ${JSON.stringify(userTasteInfo.topTracksLongTerm)}
      
      Top Artists (Short Term - Last 4 weeks): ${JSON.stringify(userTasteInfo.topArtistsShortTerm)}
      Top Tracks (Short Term - Last 4 weeks): ${JSON.stringify(userTasteInfo.topTracksShortTerm)}
      
      Recently Played: ${JSON.stringify(userTasteInfo.recentlyPlayed)}
      
      Based on this comprehensive data across different time periods:
      1. What musical patterns do you notice in their taste? Consider their evolution over time
      2. Recommend 5 specific track titles they might enjoy (ONLY the song titles, no artists)
      3. Recommend 5 specific artists they might enjoy that aren't in their top artists
      4. Recommend 5 specific albums they might enjoy
      5. Suggest 3-5 genres they might like to explore
      6. Write a short, witty roast of their music taste (be playful and mean, hurt their feelings as much as possible)
      7. Write a horoscope-style personality reading based on their music choices
      
      Don't repeat the same artist or track in the recommendations.
      Don't recommend the user song of artist or album he already has in his top tracks or top artists.
      For the track recommendations, provide ONLY the song titles - we will search for the correct artists using Spotify API.

      Return your response as a clean JSON object with these fields only:
      {
        "patterns": ["pattern1", "pattern2", ...],
        "recommendedTracks": ["track title 1", "track title 2", ...],
        "recommendedArtists": ["artist1", "artist2", ...],
        "recommendedAlbums": ["album1", "album2", ...],
        "recommendedGenres": ["genre1", "genre2", ...],
        "roast": "witty roast text",
        "personalityReading": "horoscope-style reading"
      }
      
      IMPORTANT: Return ONLY the JSON with no explanations, no backticks, and no markdown formatting. Just the raw JSON data.
      VERY IMPORTANT: DO NOT REPEAT ARTIST, SONGS OR ALBUMS IN THE RECOMMENDATIONS. AND UNDER NO CIRCUMSTANCES RECOMMEND THE USER AN ALBUM, SONG OR ARTIST THAT HE ALREADY HAS IN HIS TOP TRACKS OR TOP ARTISTS.
      LANGUAGE: Answer in Spanish.
    `;
    
    // Configure model(s) based on environment variable
    const modelsConfig = process.env.OPENROUTER_MODELS || "openai/gpt-4o-mini:online";
    let completionParams: any = {
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };
    
    try {
      // Try to parse as JSON array first
      const parsedModels = JSON.parse(modelsConfig);
      if (Array.isArray(parsedModels) && parsedModels.length > 0) {
        // Use first model as primary and set models array for fallback
        completionParams.model = parsedModels[0];
        completionParams.models = parsedModels;
      } else {
        completionParams.model = String(parsedModels);
      }
    } catch {
      // If parsing fails, treat as single model string
      completionParams.model = modelsConfig;
    }
    
    const completion = await openai.chat.completions.create(completionParams);
    
    const openaiResponse = completion.choices[0].message.content || "";
    try {
      const cleanedResponse = extractJsonFromMarkdown(openaiResponse);        
      aiInsights = JSON.parse(cleanedResponse);
      aiInsights.patterns = aiInsights.patterns || [];
      aiInsights.recommendedTracks = aiInsights.recommendedTracks || [];
      aiInsights.recommendedArtists = aiInsights.recommendedArtists || [];
      aiInsights.recommendedAlbums = aiInsights.recommendedAlbums || [];
      aiInsights.recommendedGenres = aiInsights.recommendedGenres || [];
    } catch (error) {
      console.error("Failed to parse OpenAI response:", error);
      aiInsights = {
        patterns: ["Based on your listening history"],
        recommendedTracks: [],
        recommendedArtists: [],
        recommendedAlbums: [],
        recommendedGenres: [],
        roast: "Your music taste is so unique, even AI can't roast it!",
        personalityReading: "Your musical journey is still unfolding..."
      };
    }

    const [enrichedArtists, enrichedAlbums, enrichedTracks] = await Promise.all([
      searchSpotifyArtists(token, aiInsights.recommendedArtists),
      searchSpotifyAlbums(token, aiInsights.recommendedAlbums),
      searchSpotifyTracksByTitle(token, aiInsights.recommendedTracks)
    ]);
    
    const results = {
      patterns: aiInsights.patterns,
      recommendedArtists: enrichedArtists,
      recommendedAlbums: enrichedAlbums, 
      recommendedTracks: enrichedTracks,
      recommendedGenres: aiInsights.recommendedGenres,
      roast: aiInsights.roast || "Your music taste is so unique, even AI can't roast it!",
      personalityReading: aiInsights.personalityReading || "Your musical journey is still unfolding...",
      userTaste: {
        topArtists: userTasteInfo.topArtists.map((artist: any) => artist.name),
        topTracks: userTasteInfo.topTracks.map((track: any) => `${track.name} by ${track.artist}`),
        genres: uniqueGenres,
        stats: {
          avgPopularity: Math.round(userTasteInfo.topTracks.reduce((acc: number, track: any) => acc + track.popularity, 0) / userTasteInfo.topTracks.length),
          avgEnergy: Math.round(userTasteInfo.topTracks.reduce((acc: number, track: any) => acc + (track.energy || 0), 0) / userTasteInfo.topTracks.length * 100),
          explicitRatio: Math.round((userTasteInfo.topTracks.filter((track: any) => track.explicit).length / userTasteInfo.topTracks.length) * 100)
        }
      }
    };
    
    // Store in KV
    await env.kv.put(key, JSON.stringify(results), { expirationTtl: 86400 }); // Cache for 24 hours
      
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
} 