'use client';

import Image from "next/image";

interface ArtistCardProps {
  id: string;
  name: string;
  genres?: string[];
  imageUrl: string | null;
  popularity?: number;
  rank?: number;
  spotifyUrl?: string;
}

export default function ArtistCard({
  id,
  name,
  genres,
  imageUrl,
  popularity,
  rank,
  spotifyUrl,
}: ArtistCardProps) {
  return (
    <div className="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-transform hover:scale-[1.02]">
      <div className="relative pb-[100%]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
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
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
        {rank && (
          <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-sm font-bold">
            #{rank}
          </div>
        )}
        {popularity && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs">
            {popularity}/100
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">{name}</h3>
        {genres && genres.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {genres.slice(0, 3).map((genre) => (
              <span 
                key={genre} 
                className="inline-block bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300"
              >
                {genre}
              </span>
            ))}
            {genres.length > 3 && (
              <span className="inline-block bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300">
                +{genres.length - 3}
              </span>
            )}
          </div>
        )}
        {spotifyUrl && (
          <a
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center text-sm text-green-600 dark:text-green-400 hover:underline"
          >
            <svg 
              className="h-4 w-4 mr-1" 
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Open in Spotify
          </a>
        )}
      </div>
    </div>
  );
} 