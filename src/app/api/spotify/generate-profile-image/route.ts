import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import puppeteer from "@cloudflare/puppeteer";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface ProfileImageData {
  userInfo: {
    name: string;
    email?: string;
    imageUrl?: string;
  };
  topTracks: Array<{
    name: string;
    artist: string;
    imageUrl?: string;
    popularity: number;
  }>;
  topArtists: Array<{
    name: string;
    genres: string[];
    imageUrl?: string;
    popularity: number;
  }>;
  recentTracks: Array<{
    name: string;
    artist: string;
    imageUrl?: string;
    playedAt?: string;
  }>;
  timeRange: 'short_term' | 'medium_term' | 'long_term';
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get data from request body
    const data = await request.json() as ProfileImageData;
    console.log('Received data:', data);

    // Generate HTML content for the image
    const htmlContent = generateProfileCardHTML(data);

    // Get Cloudflare context and browser binding
    const { env } = getCloudflareContext();
    
    // Launch puppeteer browser using Cloudflare's API
    const browser = await puppeteer.launch(env.PUPPETEER, {
      keep_alive: 10000 // Keep browser alive for 1 minute
    });

    const page = await browser.newPage();
    
    // Set viewport to match our desired image size
    await page.setViewport({ width: 800, height: 1000 });
    
    // Set content and wait for fonts/images to load
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Take screenshot
    const imageBuffer = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: 800, height: 1000 }
    });

    await browser.close();

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="mi-perfil-spotify.png"'
      }
    });

  } catch (error) {
    console.error('Error generating profile image:', error);
    return NextResponse.json(
      { error: 'Failed to generate profile image' },
      { status: 500 }
    );
  }
}

function generateProfileCardHTML(data: ProfileImageData) {
  const { userInfo, topTracks, topArtists, timeRange, recentTracks } = data;
  
  const timeRangeLabels = {
    'short_term': 'Últimas 4 semanas',
    'medium_term': 'Últimos 6 meses', 
    'long_term': 'Desde siempre'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          width: 800px;
          height: 1000px;
          background: linear-gradient(135deg, #1db954 0%, #1ed760 50%, #0d7d3a 100%);
          color: white;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .header {
          text-align: center;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 20px;
        }
        
        .user-info {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }
        
        .avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 3px solid #1ed760;
          margin-right: 16px;
          object-fit: cover;
        }
        
        .user-details h1 {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
        }
        
        .user-details p {
          font-size: 16px;
          opacity: 0.9;
          margin: 4px 0 0 0;
        }
        
        .time-range {
          background: rgba(30, 215, 96, 0.2);
          color: #1ed760;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          display: inline-block;
          margin-top: 8px;
        }
        
        .content {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .section {
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 16px;
          height: fit-content;
        }
        
        .section h2 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .track-item, .artist-item {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }
        
        .track-item:last-child, .artist-item:last-child {
          margin-bottom: 0;
        }
        
        .rank {
          font-size: 16px;
          font-weight: 700;
          margin-right: 12px;
          color: #1ed760;
          min-width: 20px;
        }
        
        .item-image {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          margin-right: 12px;
          object-fit: cover;
          background: rgba(255, 255, 255, 0.1);
        }
        
        .item-info {
          flex: 1;
        }
        
        .item-name {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .item-artist, .item-genres {
          font-size: 12px;
          opacity: 0.8;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .popularity {
          font-size: 12px;
          color: #1ed760;
          font-weight: 600;
        }
        
        .stats-section {
          grid-column: 1 / -1;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 12px;
        }
        
        .stat-item {
          text-align: center;
          background: rgba(255, 255, 255, 0.1);
          padding: 16px;
          border-radius: 8px;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #1ed760;
          display: block;
        }
        
        .stat-label {
          font-size: 12px;
          opacity: 0.8;
          margin-top: 4px;
        }
        
        .footer {
          text-align: center;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 12px;
        }
        
        .footer p {
          font-size: 12px;
          opacity: 0.7;
          margin: 0;
        }
        
        .footer p:last-child {
          opacity: 0.5;
          margin-top: 4px;
        }
        
        .spotify-icon {
          color: #1ed760;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="user-info">
          ${userInfo?.imageUrl ? `<img src="${userInfo.imageUrl}" alt="User" class="avatar">` : ''}
          <div class="user-details">
            <h1>🎵 ${userInfo?.name || 'Mi Perfil de Spotify'}</h1>
            ${userInfo?.email ? `<p>${userInfo.email}</p>` : ''}
          </div>
        </div>
        <div class="time-range">${timeRangeLabels[timeRange]}</div>
      </div>
      
      <div class="content">
        <div class="section">
          <h2>🎤 Top Canciones</h2>
          ${topTracks.slice(0, 5).map((track, index) => `
            <div class="track-item">
              <div class="rank">${index + 1}</div>
              ${track.imageUrl ? `<img src="${track.imageUrl}" alt="${track.name}" class="item-image">` : '<div class="item-image"></div>'}
              <div class="item-info">
                <div class="item-name">${track.name}</div>
                <div class="item-artist">${track.artist}</div>
              </div>
              <div class="popularity">${track.popularity}%</div>
            </div>
          `).join('')}
        </div>
        
        <div class="section">
          <h2>🎨 Top Artistas</h2>
          ${topArtists.slice(0, 5).map((artist, index) => `
            <div class="artist-item">
              <div class="rank">${index + 1}</div>
              ${artist.imageUrl ? `<img src="${artist.imageUrl}" alt="${artist.name}" class="item-image">` : '<div class="item-image"></div>'}
              <div class="item-info">
                <div class="item-name">${artist.name}</div>
                <div class="item-genres">${artist.genres.slice(0, 2).join(', ')}</div>
              </div>
              <div class="popularity">${artist.popularity}%</div>
            </div>
          `).join('')}
        </div>
        
        ${recentTracks.length > 0 ? `
          <div class="section stats-section">
            <h2>🕒 Escuchadas Recientemente</h2>
            ${recentTracks.slice(0, 5).map((track, index) => `
              <div class="track-item">
                <div class="rank">${index + 1}</div>
                ${track.imageUrl ? `<img src="${track.imageUrl}" alt="${track.name}" class="item-image">` : '<div class="item-image"></div>'}
                <div class="item-info">
                  <div class="item-name">${track.name}</div>
                  <div class="item-artist">${track.artist}</div>
                </div>
                ${track.playedAt ? `<div class="popularity">${new Date(track.playedAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
      
      <div class="footer">
        <p>Generado con Spot-a-Lyst</p>
        <p>🎵 Tu música, tu historia</p>
      </div>
    </body>
    </html>
  `;
} 