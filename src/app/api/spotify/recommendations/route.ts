import { getTopArtists, getTopTracks, searchSpotifyArtists, searchSpotifyAlbums, searchSpotifyTracks, extractJsonFromMarkdown, getSpotifyToken } from "@/lib/spotify";
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
    
    // Check KV for cached data
    const { env } = getCloudflareContext();
    const key = `user:${userId}:recommendations`;
    const cachedData = await env.spotalyst.get(key);
    
    if (cachedData) {
      // Return cached data if available
      return NextResponse.json(JSON.parse(cachedData));
    }
    
    // If no cached data, generate new recommendations
    const url = new URL(request.url);
    const token = await getSpotifyToken(userId);
    const [topTracks, topArtists] = await Promise.all([
      getTopTracks(token, "medium_term", 5),
      getTopArtists(token, "medium_term", 5),
    ]);

    const allGenres = topArtists.flatMap((artist: any) => artist.genres || []);
    const uniqueGenres = [...new Set(allGenres)].slice(0, 3) as string[];

    const userTasteInfo = {
      topArtists: topArtists.slice(0, 5).map((artist: any) => ({
        name: artist.name,
        genres: artist.genres,
        popularity: artist.popularity
      })),
      topTracks: topTracks.slice(0, 5).map((track: any) => ({
        name: track.name,
        artist: track.artists.map((a: any) => a.name).join(", "),
        popularity: track.popularity
      }))
    };
    let aiInsights;
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `
      As a music expert AI, analyze this user's listening preferences:
      
      Top Artists: ${JSON.stringify(userTasteInfo.topArtists)}
      Top Tracks: ${JSON.stringify(userTasteInfo.topTracks)}
      
      Based on this data:
      1. What musical patterns do you notice in their taste?
      2. Recommend 5 specific tracks they might enjoy
      3. Recommend 5 specific artists they might enjoy that aren't in their top artists
      4. Recommend 5 specific albums they might enjoy
      5. Suggest 3-5 genres they might like to explore
      
      Return your response as a clean JSON object with these fields only:
      {
        "patterns": ["pattern1", "pattern2", ...],
        "recommendedTracks": [{"name": "track name", "artist": "artist name"}, ...],
        "recommendedArtists": ["artist1", "artist2", ...],
        "recommendedAlbums": ["album1", "album2", ...],
        "recommendedGenres": ["genre1", "genre2", ...]
      }
      
      IMPORTANT: Return ONLY the JSON with no explanations, no backticks, and no markdown formatting.
      Just the raw JSON data.
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
      console.log("Raw response:", geminiResponse);
      aiInsights = {
        patterns: ["Based on your listening history"],
        recommendedTracks: [],
        recommendedArtists: [],
        recommendedAlbums: [],
        recommendedGenres: []
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
      userTaste: {
        topArtists: userTasteInfo.topArtists.map((artist: any) => artist.name),
        topTracks: userTasteInfo.topTracks.map((track: any) => `${track.name} by ${track.artist}`),
        genres: uniqueGenres,
      }
    };
    
    // Store in KV
    await env.spotalyst.put(key, JSON.stringify(results), { expirationTtl: 86400 }); // Cache for 24 hours
      
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
} 