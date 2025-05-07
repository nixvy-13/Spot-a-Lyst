'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import StatsGrid from '@/components/StatsGrid';
import TrackCard from '@/components/TrackCard';
import ArtistCard from '@/components/ArtistCard';
import { spotifyApi } from '@/lib/apiClient';
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
  const [isLoading, setIsLoading] = useState({
    tracks: false,
    artists: false,
    recent: false,
  });

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
            Please login with your Spotify account to view your profile and stats.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* User Profile Header */}
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
            {user.primaryEmailAddress && (
              <p className="text-gray-600 dark:text-gray-300">{user.primaryEmailAddress.emailAddress}</p>
            )}
            <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-3">
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm">
                Spotify User
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Top Tracks Section */}
      <StatsGrid
        title="Your Top Tracks"
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

      {/* Top Artists Section */}
      <StatsGrid
        title="Your Top Artists"
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

      {/* Recently Played Section */}
      <StatsGrid
        title="Recently Played"
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
          />
        ))}
      </StatsGrid>
    </div>
  );
} 