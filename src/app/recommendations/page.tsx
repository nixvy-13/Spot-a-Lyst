'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { SignInButton, useAuth, useUser} from '@clerk/nextjs';
import { spotifyApi } from '@/lib/apiClient';
import RecommendationsImageCard from '@/components/RecommendationsImageCard';
import { captureComponentAsImage, waitForImagesToLoad, waitForFontsToLoad } from '@/lib/imageGeneration';

interface RecommendedTrack {
  name: string;
  id: string;
  artist: string;
  album: string;
  popularity: number;
  duration: number;
  previewUrl: string | null;
  spotifyUrl: string;
  imageUrl: string | null;
  notFound?: boolean;
  error?: boolean;
}

interface RecommendedArtist {
  name: string;
  id: string;
  genres: string[];
  popularity: number;
  imageUrl: string | null;
  spotifyUrl: string;
  notFound?: boolean;
  error?: boolean;
}

interface RecommendedAlbum {
  name: string;
  id: string;
  artist: string;
  releaseDate: string;
  imageUrl: string | null;
  spotifyUrl: string;
  totalTracks: number;
  notFound?: boolean;
  error?: boolean;
}

interface UserTaste {
  topArtists: string[];
  topTracks: string[];
  genres: string[];
  stats: {
    avgPopularity: number;
    avgEnergy: number;
    explicitRatio: number;
  };
}

interface ApiResponse {
  patterns: string[];
  recommendedArtists: RecommendedArtist[];
  recommendedAlbums: RecommendedAlbum[];
  recommendedTracks: RecommendedTrack[];
  recommendedGenres: string[];
  roast: string;
  personalityReading: string;
  userTaste: UserTaste;
  error?: string;
}

export default function RecommendationsPage() {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const [patterns, setPatterns] = useState<string[]>([]);
  const [recommendedArtists, setRecommendedArtists] = useState<RecommendedArtist[]>([]);
  const [recommendedAlbums, setRecommendedAlbums] = useState<RecommendedAlbum[]>([]);
  const [recommendedTracks, setRecommendedTracks] = useState<RecommendedTrack[]>([]);
  const [recommendedGenres, setRecommendedGenres] = useState<string[]>([]);
  const [roast, setRoast] = useState<string>("");
  const [personalityReading, setPersonalityReading] = useState<string>("");
  const [userTaste, setUserTaste] = useState<UserTaste | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tracks' | 'artists' | 'albums'>('tracks');
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [showImageCard, setShowImageCard] = useState<boolean>(false);

  useEffect(() => {
    if (user?.id) {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = async (regenerate = false) => {
    if (!user?.id) return;
    
    try {
      if (regenerate) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      const data = await spotifyApi.getAIRecommendations(regenerate);
      
      setPatterns(data.patterns || []);
      setRecommendedArtists(data.recommendedArtists || []);
      setRecommendedAlbums(data.recommendedAlbums || []);
      setRecommendedTracks(data.recommendedTracks || []);
      setRecommendedGenres(data.recommendedGenres || []);
      setRoast(data.roast || "");
      setPersonalityReading(data.personalityReading || "");
      
      if (data.userTaste) {
        setUserTaste(data.userTaste);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError('Failed to fetch recommendations. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const refreshRecommendations = () => {
    fetchRecommendations(true);
  };

  const generateShareImage = async () => {
    if (isGeneratingImage) return;
    
    try {
      setIsGeneratingImage(true);
      setShowImageCard(true);
      
      // Wait for the component to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Wait for fonts and images to load
      await waitForFontsToLoad();
      const element = document.getElementById('recommendations-image-card-capture');
      if (element) {
        await waitForImagesToLoad(element);
        // Additional wait to ensure everything is properly rendered
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Capture the image
      await captureComponentAsImage(
        'recommendations-image-card-capture',
        'mi-analisis-musical.png',
        1600,
        2000
      );
      
    } catch (error) {
      console.error('Error generando imagen:', error);
      alert('Error al generar la imagen. Por favor intenta de nuevo.');
    } finally {
      setIsGeneratingImage(false);
      setShowImageCard(false);
    }
  };

  // Prepare data for the image card
  const imageCardData = {
    patterns,
    roast,
    personalityReading,
    recommendedGenres,
    userTaste: userTaste || { stats: { avgPopularity: 0, avgEnergy: 0, explicitRatio: 0 } },
    userInfo: {
      name: user?.fullName || user?.firstName || 'Usuario',
      imageUrl: user?.imageUrl || undefined
    }
  };

  if (isLoading) {
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
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Por favor inicia sesion con tu cuenta de Spotify para ver recomendaciones de musica personalizadas.
          </p>
          <SignInButton>
            Inicia sesion
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hidden Image Card for Capture */}
      {showImageCard && (
        <div 
          id="recommendations-image-card-capture"
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
          <RecommendationsImageCard data={imageCardData} />
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Recomendaciones de la IA</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Descubre nueva musica basada en tus hábitos de escucha. La IA analizara tus canciones y artistas mas escuchados para recomendarte música afín a tus gustos.
            </p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            {/* Botón para generar imagen */}
            {(roast || personalityReading) && (
              <button
                onClick={generateShareImage}
                disabled={isGeneratingImage}
                className={`px-4 py-2 rounded-md flex items-center transition-colors ${
                  isGeneratingImage
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isGeneratingImage ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generando...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                    </svg>
                    Generar imagen para compartir en RRSS
                  </>
                )}
              </button>
            )}
            <button
              onClick={refreshRecommendations}
              disabled={isRefreshing}
              className={`px-4 py-2 rounded-md flex items-center transition-colors ${
                isRefreshing
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isRefreshing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Recargando...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                  </svg>
                  Recargar Recomendaciones
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {userTaste && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-lg p-4 text-blue-800 dark:text-blue-300 mb-6">
            <h3 className="font-medium flex items-center mb-2">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              Basado en tus gustos
            </h3>
            <p className="text-sm">
              Estas recomendaciones estan generadas basandose en tu historial de escuchas.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {userTaste.topArtists.slice(0, 3).map((artist, index) => (
                <span key={`artist-${index}`} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                  {artist}
                </span>
              ))}
              {userTaste.genres.slice(0, 3).map((genre, index) => (
                <span key={`genre-${index}`} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                  {genre}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {patterns.length > 0 && (
        <div className="space-y-6">
          <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center text-purple-800 dark:text-purple-300">
              <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 16h2v-2h-2v2zm1.61-9.96c-.36-.74-1.1-1.25-1.96-1.25-1.2 0-2.18.95-2.2 2.14h1.76c0-.39.33-.7.72-.7.4 0 .72.31.72.7 0 .39-.32.7-.72.7-.16 0-.28.11-.28.25V12h1.76v-1.61c.75-.25 1.3-.97 1.3-1.81 0-.54-.23-1.04-.6-1.39-.1-.1-.22-.19-.35-.27-.06-.04-.13-.09-.2-.12-.05-.04-.12-.06-.19-.1z" />
              </svg>
              Insights de la IA
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2 text-purple-700 dark:text-purple-400">Tus patrones musicales</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {patterns.map((pattern, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300">{pattern}</li>
                  ))}
                </ul>
              </div>
              
              {recommendedGenres.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-purple-700 dark:text-purple-400">Generos a Explorar</h3>
                  <div className="flex flex-wrap gap-2">
                    {recommendedGenres.map((genre, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Carta stats de musica */}
          {userTaste?.stats && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center text-blue-800 dark:text-blue-300">
                <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
                </svg>
                Tus estadísticas musicales
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Media de popularidad</h3>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userTaste.stats.avgPopularity}%</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Media de energia</h3>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userTaste.stats.avgEnergy}%</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Contenido explícito</h3>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userTaste.stats.explicitRatio}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Carta de roast */}
          {roast && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center text-red-800 dark:text-red-300">
                <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17h2v-2h-2v2zm2.07-7.75l-.9.92c-.5.51-.86.97-1.04 1.69-.08.32-.13.68-.13 1.14h2v-.5c0-.46.08-.9.22-1.31.2-.58.53-1.1.95-1.52l1.24-1.26c.46-.44.68-1.1.55-1.8-.13-.72-.69-1.33-1.39-1.53-1.11-.31-2.14.32-2.47 1.27-.12.35-.43.58-.82.58-.5 0-.9-.5-.8-1.01.43-1.47 1.68-2.59 3.23-2.83 1.52-.24 2.97.55 3.87 1.8 1.18 1.63.83 3.38-.19 4.4z"/>
                </svg>
                Lo que la IA dice de ti
              </h2>
              <p className="text-gray-700 dark:text-gray-300 italic">{roast}</p>
            </div>
          )}

          {/* Carta de lectura de personalidad */}
          {personalityReading && (
            <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center text-indigo-800 dark:text-indigo-300">
                <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
                Tu horóscopo musical
              </h2>
              <p className="text-gray-700 dark:text-gray-300">{personalityReading}</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* Navegacion */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === 'tracks'
                ? 'text-green-600 border-b-2 border-green-500 dark:text-green-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
            onClick={() => setActiveTab('tracks')}
          >
            Canciones
          </button>
          <button
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === 'artists'
                ? 'text-green-600 border-b-2 border-green-500 dark:text-green-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
            onClick={() => setActiveTab('artists')}
          >
            Artistas
          </button>
          <button
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === 'albums'
                ? 'text-green-600 border-b-2 border-green-500 dark:text-green-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
            onClick={() => setActiveTab('albums')}
          >
            Albums
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Canciones */}
          {activeTab === 'tracks' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Canciones Recomendadas</h2>
              {recommendedTracks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendedTracks.map((track, index) => (
                    <div key={index} className="flex bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-24 h-24 flex-shrink-0 relative">
                        {track.imageUrl ? (
                          <Image 
                            src={track.imageUrl} 
                            alt={track.name} 
                            fill 
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <svg className="h-10 w-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex flex-col justify-between flex-grow">
                        <div>
                          <h3 className="font-semibold text-lg leading-tight">{track.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{track.artist}</p>
                        </div>
                        <a 
                          href={track.spotifyUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-green-600 dark:text-green-400 text-sm inline-flex items-center"
                        >
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                          </svg>
                          Escúchalo en Spotify
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400">No hay recomendaciones de canciones disponibles</p>
              )}
            </div>
          )}

          {/* Artistas */}
          {activeTab === 'artists' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Artistas Recomendados</h2>
              {recommendedArtists.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {recommendedArtists.map((artist, index) => (
                    <a
                      key={index}
                      href={artist.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center"
                    >
                      <div className="w-full aspect-square relative rounded-full overflow-hidden mb-3 shadow-md group-hover:shadow-lg transition-shadow">
                        {artist.imageUrl ? (
                          <Image 
                            src={artist.imageUrl} 
                            alt={artist.name} 
                            fill 
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <svg className="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium text-center">{artist.name}</h3>
                      {artist.genres && artist.genres.length > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                          {artist.genres.slice(0, 2).join(', ')}
                        </p>
                      )}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400">No hay recomendaciones de artistas disponibles</p>
              )}
            </div>
          )}

          {/* Albums Tab */}
          {activeTab === 'albums' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Álbumes recomendados</h2>
              {recommendedAlbums.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {recommendedAlbums.map((album, index) => (
                    <a
                      key={index}
                      href={album.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <div className="mb-3 aspect-square relative rounded-md overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                        {album.imageUrl ? (
                          <Image 
                            src={album.imageUrl} 
                            alt={album.name} 
                            fill 
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <svg className="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium leading-tight">{album.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{album.artist}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {album.releaseDate?.substring(0, 4)} • {album.totalTracks} tracks
                      </p>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400">No hay recomendaciones de álbumes disponibles</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}