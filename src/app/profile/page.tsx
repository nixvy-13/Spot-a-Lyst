'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import StatsGrid from '@/components/StatsGrid';
import TrackCard from '@/components/TrackCard';
import ArtistCard from '@/components/ArtistCard';
import ProfileImageCard from '@/components/ProfileImageCard';
import { spotifyApi } from '@/lib/apiClient';
import { captureComponentAsImage, waitForImagesToLoad, waitForFontsToLoad } from '@/lib/imageGeneration';
import { Artist, Track, TimeRange } from '@/types/spotify';

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'short_term', label: 'Last 4 Weeks' },
  { value: 'medium_term', label: 'Last 6 Months' },
  { value: 'long_term', label: 'All Time' },
];

export default function ProfilePage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState({
    tracks: false,
    artists: false,
    recent: false,
  });
  const [activeTab, setActiveTab] = useState<'tracks' | 'artists' | 'albums'>('tracks');
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [showImageCard, setShowImageCard] = useState<boolean>(false);

  const fetchTopTracks = async (range: TimeRange) => {
    if (!isSignedIn) return;
    
    try {
      setIsLoading(prev => ({ ...prev, tracks: true }));
      const tracks = await spotifyApi.getTopTracks(range);
      setTopTracks(tracks);
    } catch (err) {
      console.error('Failed to fetch top tracks:', err);
    } finally {
      setIsLoading(prev => ({ ...prev, tracks: false }));
    }
  };

  const fetchTopArtists = async (range: TimeRange) => {
    if (!isSignedIn) return;
    
    try {
      setIsLoading(prev => ({ ...prev, artists: true }));
      const artists = await spotifyApi.getTopArtists(range);
      setTopArtists(artists);
    } catch (err) {
      console.error('Failed to fetch top artists:', err);
    } finally {
      setIsLoading(prev => ({ ...prev, artists: false }));
    }
  };

  const fetchRecentlyPlayed = async () => {
    if (!isSignedIn) return;
    
    try {
      setIsLoading(prev => ({ ...prev, recent: true }));
      const tracks = await spotifyApi.getRecentlyPlayed();
      setRecentlyPlayed(tracks);
    } catch (err) {
      console.error('Failed to fetch recently played:', err);
    } finally {
      setIsLoading(prev => ({ ...prev, recent: false }));
    }
  };

  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange);
    fetchTopTracks(newRange);
    fetchTopArtists(newRange);
  };
  
  const handleRefreshStats = async () => {
    if (!isSignedIn || isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      await spotifyApi.refreshSpotifyStats();
      
      // Reload all data
      await Promise.all([
        fetchTopTracks(timeRange),
        fetchTopArtists(timeRange),
        fetchRecentlyPlayed()
      ]);
      
      // Also refresh recommendations in the background
      fetch('/api/spotify/recommendations?force=true').catch(err => {
        console.error('Failed to refresh recommendations:', err);
      });
    } catch (err) {
      console.error('Failed to refresh stats:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const generateProfileImage = async () => {
    if (isGeneratingImage || !user) return;
    
    try {
      setIsGeneratingImage(true);
      setShowImageCard(true);
      
      // Wait for the component to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Wait for fonts and images to load
      await waitForFontsToLoad();
      const element = document.getElementById('profile-image-card-capture');
      if (element) {
        await waitForImagesToLoad(element);
        // Additional wait to ensure everything is properly rendered
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Capture the image
      await captureComponentAsImage(
        'profile-image-card-capture',
        'mi-perfil-spotify.png',
        1600,
        2000
      );
      
    } catch (error) {
      console.error('Error generando imagen del perfil:', error);
      alert('Error al generar la imagen del perfil. Por favor intenta de nuevo.');
    } finally {
      setIsGeneratingImage(false);
      setShowImageCard(false);
    }
  };

  // Prepare data for the image card
  const imageCardData = {
    userInfo: {
      name: user?.fullName || user?.firstName || 'Usuario',
      imageUrl: user?.imageUrl || undefined
    },
    topTracks: topTracks.slice(0, 5).map(track => ({
      name: track.name,
      artist: track.artist,
      imageUrl: track.imageUrl || undefined,
      popularity: track.popularity || 0
    })),
    topArtists: topArtists.slice(0, 5).map(artist => ({
      name: artist.name,
      genres: artist.genres,
      imageUrl: artist.imageUrl || undefined,
      popularity: artist.popularity || 0
    })),
    recentTracks: recentlyPlayed.slice(0, 5).map(track => ({
      name: track.name,
      artist: track.artist,
      imageUrl: track.imageUrl || undefined,
      playedAt: track.playedAt
    })),
    timeRange
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchTopTracks(timeRange);
      fetchTopArtists(timeRange);
      fetchRecentlyPlayed();
    }
  }, [isSignedIn, timeRange]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[70vh]">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md mx-auto text-center">
          <svg className="h-24 w-24 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.06-7.44 7-7.93v15.86zm2-15.86c1.03.13 2 .45 2.87.93H13v-.93zM13 7h5.24c.25.31.48.65.68 1H13V7zm0 3h6.74c.08.33.15.66.19 1H13v-1zm0 9.93V19h2.87c-.87.48-1.84.8-2.87.93zM18.24 17H13v-1h5.92c-.2.35-.43.69-.68 1zm1.5-3H13v-1h6.93c-.04.34-.11.67-.19 1z" />
          </svg>
          <h2 className="text-2xl font-bold mb-4">You need to be logged in</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Por favor inicia sesion con tu cuenta de Spotify para ver tu perfil y estadísticas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hidden Image Card for Capture */}
      {showImageCard && (
        <div 
          id="profile-image-card-capture"
          style={{
            position: 'fixed',
            top: '-100vh',
            left: '0',
            zIndex: -1,
            pointerEvents: 'none',
            opacity: 0,
            visibility: 'hidden'
          }}
        >
          <ProfileImageCard data={imageCardData} />
        </div>
      )}

      {/* Header Perfil de Usuario */}
      {user && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {user.imageUrl && (
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden">
              <Image
                src={user.imageUrl}
                alt={user.fullName || "User"}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold">{user.fullName}</h1>
            <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-3">
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm">
                Usuario de Spotify
              </span>
              
              {/* Botón para generar imagen del perfil */}
              {topTracks.length > 0 && topArtists.length > 0 && recentlyPlayed.length > 0 && (
                <button
                  onClick={generateProfileImage}
                  disabled={isGeneratingImage}
                  className={`flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
                    isGeneratingImage
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/50'
                  }`}
                >
                  {isGeneratingImage ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generando...
                    </>
                  ) : (
                    <>
                      <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                      </svg>
                      Generar imagen para compartir en RRSS
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={handleRefreshStats}
                disabled={isRefreshing}
                className={`flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
                  isRefreshing
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50'
                }`}
              >
                {isRefreshing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Recargando...
                  </>
                ) : (
                  <>
                    <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Recargar Estadísticas
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seccion de canciones top */}
      <StatsGrid
        title="Tu Top de Canciones"
        timeRangeOptions={TIME_RANGE_OPTIONS}
        onTimeRangeChange={handleTimeRangeChange}
        isLoading={isLoading.tracks}
      >
        {topTracks.map((track, index) => (
          <TrackCard
            key={track.id}
            id={track.id}
            name={track.name}
            artist={track.artist}
            album={track.album}
            imageUrl={track.imageUrl}
            popularity={track.popularity}
            spotifyUrl={track.spotifyUrl}
            previewUrl={track.previewUrl}
            rank={index + 1}
          />
        ))}
      </StatsGrid>

      {/* Seccion de artistas top */}
      <StatsGrid
        title="Tu Top de Artistas"
        timeRangeOptions={TIME_RANGE_OPTIONS}
        onTimeRangeChange={handleTimeRangeChange}
        isLoading={isLoading.artists}
      >
        {topArtists.map((artist, index) => (
          <ArtistCard
            key={artist.id}
            id={artist.id}
            name={artist.name}
            genres={artist.genres}
            imageUrl={artist.imageUrl}
            popularity={artist.popularity}
            rank={index + 1}
          />
        ))}
      </StatsGrid>

      {/* Secion de recien escuchadas */}
      <StatsGrid
        title="Escuchadas Recientemente"
        isLoading={isLoading.recent}
      >
        {recentlyPlayed.slice(0, 10).map((track) => (
          <TrackCard
            key={`${track.id}-${track.playedAt}`}
            id={track.id}
            name={track.name}
            artist={track.artist}
            album={track.album}
            imageUrl={track.imageUrl}
            spotifyUrl={track.spotifyUrl}
            playCount={track.playCount}
          />
        ))}
      </StatsGrid>
    </div>
  );
} 