import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get data from request body
    const data = await request.json() as {
      patterns: string[];
      roast: string;
      personalityReading: string;
      recommendedGenres: string[];
      userTaste: any;
      userInfo: {
        name: string;
        imageUrl?: string;
      };
    };
    
    // Generate HTML content for the image
    const htmlContent = generateShareCardHTML({
      patterns: data.patterns,
      roast: data.roast,
      personalityReading: data.personalityReading,
      recommendedGenres: data.recommendedGenres,
      userTaste: data.userTaste,
      userInfo: data.userInfo
    });

    // Launch puppeteer browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set viewport to match our desired image size
    await page.setViewport({ width: 800, height: 800 });
    
    // Set content and wait for fonts/images to load
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Take screenshot
    const imageBuffer = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: 800, height: 800 }
    });

    await browser.close();

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="mi-analisis-musical.png"'
      }
    });

  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}

function generateShareCardHTML(data: any) {
  const {
    patterns = [],
    roast = '',
    personalityReading = '',
    recommendedGenres = [],
    userTaste,
    userInfo
  } = data;

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
          height: 800px;
          background: linear-gradient(135deg, #6b46c1 0%, #3b82f6 50%, #4c1d95 100%);
          color: white;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .header {
          text-align: center;
        }
        
        .user-info {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }
        
        .avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 3px solid #10b981;
          margin-right: 12px;
          object-fit: cover;
        }
        
        .user-details h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }
        
        .user-details p {
          font-size: 16px;
          opacity: 0.9;
          margin: 0;
        }
        
        .divider {
          width: 64px;
          height: 4px;
          background-color: #10b981;
          border-radius: 2px;
          margin: 8px auto 0;
        }
        
        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 12px;
          padding: 16px 0;
        }
        
        .section {
          background: rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 12px;
        }
        
        .section h2 {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        
        .section p, .section ul {
          font-size: 12px;
          line-height: 1.4;
        }
        
        .section ul {
          list-style: none;
          padding: 0;
        }
        
        .section li {
          margin-bottom: 4px;
        }
        
        .section li:before {
          content: "• ";
          margin-right: 4px;
        }
        
        .patterns-section h2 { color: #a78bfa; }
        .roast-section h2 { color: #fca5a5; }
        .personality-section h2 { color: #c4b5fd; }
        .stats-section h2 { color: #93c5fd; }
        
        .genres {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 8px;
        }
        
        .genre-tag {
          background: rgba(147, 197, 253, 0.3);
          color: #93c5fd;
          padding: 4px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          text-align: center;
        }
        
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .stat-value {
          font-size: 18px;
          font-weight: 700;
          line-height: 1;
        }
        
        .stat-label {
          font-size: 12px;
          opacity: 0.8;
          margin-top: 2px;
        }
        
        .popularity { color: #10b981; }
        .energy { color: #fbbf24; }
        .explicit { color: #f87171; }
        
        .footer {
          text-align: center;
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
      </style>
    </head>
    <body>
      <div class="header">
        <div class="user-info">
          ${userInfo?.imageUrl ? `<img src="${userInfo.imageUrl}" alt="User" class="avatar">` : ''}
          <div class="user-details">
            <h1>🎵 Mi Análisis Musical</h1>
            <p>${userInfo?.name || 'Usuario'} • Powered by AI</p>
          </div>
        </div>
        <div class="divider"></div>
      </div>
      
      <div class="content">
        ${patterns.length > 0 ? `
          <div class="section patterns-section">
            <h2>🤖 Google Gemini Insights:</h2>
            <ul>
              ${patterns.map((pattern: string) => `
                <li>${pattern.length > 65 ? pattern.substring(0, 65) + '...' : pattern}</li>
              `).join('')}
            </ul>
            ${recommendedGenres.length > 0 ? `
              <div class="genres">
                ${recommendedGenres.map((genre: string) => `
                  <span class="genre-tag">${genre}</span>
                `).join('')}
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        ${roast ? `
          <div class="section roast-section">
            <h2>🔥 Lo que la IA dice de mí:</h2>
            <p><em>${roast.length > 160 ? roast.substring(0, 160) + '...' : roast}</em></p>
          </div>
        ` : ''}
        
        ${personalityReading ? `
          <div class="section personality-section">
            <h2>✨ Mi horóscopo musical:</h2>
            <p>${personalityReading.length > 160 ? personalityReading.substring(0, 160) + '...' : personalityReading}</p>
          </div>
        ` : ''}
        
        ${userTaste?.stats ? `
          <div class="section stats-section">
            <h2>📊 Mis estadísticas:</h2>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value popularity">${userTaste.stats.avgPopularity}%</div>
                <div class="stat-label">Popularidad</div>
              </div>
              <div class="stat-item">
                <div class="stat-value energy">${userTaste.stats.avgEnergy}%</div>
                <div class="stat-label">Energía</div>
              </div>
              <div class="stat-item">
                <div class="stat-value explicit">${userTaste.stats.explicitRatio}%</div>
                <div class="stat-label">Explícito</div>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
      
      <div class="footer">
        <p>Generado con Spot-a-Lyst</p>
        <p>spotify.com</p>
      </div>
    </body>
    </html>
  `;
} 