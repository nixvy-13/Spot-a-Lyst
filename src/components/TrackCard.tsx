'use client';

import Image from "next/image";
import { useState } from "react";

interface TrackCardProps {
  id: string;
  name: string;
  artist: string;
  album?: string;
  imageUrl: string | null;
  popularity?: number;
  spotifyUrl?: string;
  previewUrl?: string | null;
  rank?: number;
  playCount?: number;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

export default function TrackCard({
  id,
  name,
  artist,
  album,
  imageUrl,
  popularity,
  spotifyUrl,
  previewUrl,
  rank,
  playCount,
  onSelect,
  isSelected,
}: TrackCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const handlePlayPreview = () => {
    if (!previewUrl) return;

    if (isPlaying && audio) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    const newAudio = new Audio(previewUrl);
    newAudio.addEventListener('ended', () => setIsPlaying(false));
    newAudio.play();
    setAudio(newAudio);
    setIsPlaying(true);
  };

  return (
    <div 
      className={`flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-transform hover:scale-[1.02] ${
        isSelected ? 'ring-2 ring-green-500' : ''
      }`}
      onClick={() => onSelect && onSelect(id)}
    >
      <div className="relative pb-[100%]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${name} by ${artist}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <svg 
              className="h-16 w-16 text-gray-400 dark:text-gray-600" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
            </svg>
          </div>
        )}
        {rank && (
          <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-sm font-bold">
            #{rank}
          </div>
        )}
        {playCount && playCount > 1 && (
          <div className="absolute top-2 right-2 bg-green-600 bg-opacity-90 text-white px-2 py-1 rounded-full text-sm font-bold">
            x{playCount}
          </div>
        )}
        {popularity && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs">
            {popularity}/100
          </div>
        )}
        {previewUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePlayPreview();
            }}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity"
          >
            <div className="bg-white bg-opacity-90 dark:bg-gray-900 dark:bg-opacity-90 p-3 rounded-full">
              {isPlaying ? (
                <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
          </button>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">{name}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm truncate">{artist}</p>
        {album && <p className="text-gray-500 dark:text-gray-400 text-xs truncate mt-1">{album}</p>}
        {spotifyUrl && (
          <a
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-3 inline-flex items-center text-sm text-green-600 dark:text-green-400 hover:underline"
          >
            <svg 
              className="h-4 w-4 mr-1" 
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Abrir en Spotify
          </a>
        )}
      </div>
    </div>
  );
} 