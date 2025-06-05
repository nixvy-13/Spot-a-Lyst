'use client';

import { SignInButton, useAuth  } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";


export default function Home() {
  const { isSignedIn } = useAuth();
  
  return (
    <div className="flex flex-col items-center justify-center space-y-10 py-10">
      <div className="text-center max-w-3xl mx-auto">
        <Image
          src="/logo.png" 
          alt="Spot-A-Lyst Logo"
          width={150}
          height={150}
          className="mx-auto mb-6"
        />
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
          Tu Spotify, <span className="text-green-500">Reimaginado</span>
        </h1>
        
        <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300">
          Descubre tus habitos musicales, y obten recomendaciones de la IA basadas en tus gustos.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
        {isSignedIn ? (
          <Link href="/profile">
            <div className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors" >
              Tu perfil
            </div>
          </Link>
        ) : (
          <SignInButton>
            <div className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors" >
              Inicia Sesión
            </div>
          </SignInButton>
        )}
      </div>
    </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Consulta tus estadísticas</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Descubre tu top de artistas, canciones, y habitos de escucha de manera visual y bonita.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm1-11h-2v3H8v2h3v3h2v-3h3v-2h-3V8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Recomendaciones de la IA</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Obten recomendaciones de musica personalizadas basadas en tu historial de escucha.
          </p>
        </div>
      </div>
    </div>
  );
}
