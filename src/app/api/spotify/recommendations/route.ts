import { getTopArtists, getTopTracks, searchSpotifyArtists, searchSpotifyAlbums, searchSpotifyTracks, extractJsonFromMarkdown, getSpotifyToken, getRecentlyPlayed } from "@/lib/spotify";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

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
      const cachedData = await env.playlister.get(key);
      
      if (cachedData) {
        // Return cached data if available
        return NextResponse.json(JSON.parse(cachedData));
      }
    }
    
    // If no cached data or force refresh, generate new recommendations
    const token = await getSpotifyToken(userId);
    const [topTracks, topArtists, topArtistsLongTerm, topTracksLongTerm, recentlyPlayed]	 = await Promise.all([
      getTopTracks(token, "medium_term", 10),
      getTopArtists(token, "medium_term", 10),
      getTopArtists(token, "long_term", 10),
      getTopTracks(token, "long_term", 10),
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
      }))
    };
    let aiInsights;
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `
      As a music expert AI with a witty personality, analyze this user's listening preferences:
      
      Top Artists: ${JSON.stringify(userTasteInfo.topArtists)}
      Top Tracks: ${JSON.stringify(userTasteInfo.topTracks)}
      
      Based on this data:
      1. What musical patterns do you notice in their taste?
      2. Recommend 5 specific tracks they might enjoy
      3. Recommend 5 specific artists they might enjoy that aren't in their top artists
      4. Recommend 5 specific albums they might enjoy
      5. Suggest 3-5 genres they might like to explore
      6. Write a short, witty roast of their music taste (be playful but not mean)
      7. Write a horoscope-style personality reading based on their music choices
      
      Return your response as a clean JSON object with these fields only:
      {
        "patterns": ["pattern1", "pattern2", ...],
        "recommendedTracks": [{"name": "track name", "artist": "artist name"}, ...],
        "recommendedArtists": ["artist1", "artist2", ...],
        "recommendedAlbums": ["album1", "album2", ...],
        "recommendedGenres": ["genre1", "genre2", ...],
        "roast": "witty roast text",
        "personalityReading": "horoscope-style reading"
      }
      
      IMPORTANT: Return ONLY the JSON with no explanations, no backticks, and no markdown formatting.
      Just the raw JSON data, answer in spanish.
    `;
    
    const geminiResult = await model.generateContent(prompt);
    const geminiResponse = await geminiResult.response.text();
    try {
      const cleanedResponse = extractJsonFromMarkdown(geminiResponse);        
      aiInsights = JSON.parse(cleanedResponse);
      aiInsights.patterns = aiInsights.patterns || [];
      aiInsights.recommendedTracks = aiInsights.recommendedTracks || [];
      aiInsights.recommendedArtists = aiInsights.recommendedArtists || [];
      aiInsights.recommendedAlbums = aiInsights.recommendedAlbums || [];
      aiInsights.recommendedGenres = aiInsights.recommendedGenres || [];
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
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
      searchSpotifyTracks(token, aiInsights.recommendedTracks)
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
    await env.playlister.put(key, JSON.stringify(results), { expirationTtl: 86400 }); // Cache for 24 hours
      
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
} 