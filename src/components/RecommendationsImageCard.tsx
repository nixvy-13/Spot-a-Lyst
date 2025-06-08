import React from 'react';

interface RecommendationsImageData {
  patterns: string[];
  roast: string;
  personalityReading: string;
  recommendedGenres: string[];
  userTaste: {
    stats: {
      avgPopularity: number;
      avgEnergy: number;
      explicitRatio: number;
    };
  };
  userInfo: {
    name: string;
    imageUrl?: string;
  };
}

interface RecommendationsImageCardProps {
  data: RecommendationsImageData;
}

const RecommendationsImageCard: React.FC<RecommendationsImageCardProps> = ({ data }) => {
  const {
    patterns = [],
    roast = '',
    personalityReading = '',
    recommendedGenres = [],
    userTaste,
    userInfo
  } = data;

  return (
    <div 
      className="recommendations-image-card"
      style={{
        fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
        width: '1600px',
        height: '2000px',
        background: 'linear-gradient(135deg, #6b46c1 0%, #3b82f6 50%, #4c1d95 100%)',
        color: 'white',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontSize: '16px',
        lineHeight: '1.6',
        wordWrap: 'normal',
        overflowWrap: 'normal',
        WebkitFontSmoothing: 'subpixel-antialiased',
        MozOsxFontSmoothing: 'auto',
        textRendering: 'geometricPrecision'
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          {userInfo?.imageUrl && (
            <div style={{
              width: '112px',
              height: '112px',
              borderRadius: '50%',
              border: '6px solid #10b981',
              marginRight: '24px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <img 
                src={userInfo.imageUrl} 
                alt="User" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
          )}
          <div>
            <h1 style={{
              fontSize: '42px',
              fontWeight: '700',
              margin: '0',
              wordBreak: 'keep-all',
              hyphens: 'none'
            }}>
              🎵 Mi Análisis Musical
            </h1>
            <p style={{
              fontSize: '28px',
              opacity: '0.9',
              margin: '0',
              wordBreak: 'keep-all'
            }}>
              {userInfo?.name || 'Usuario'} • Powered by AI
            </p>
          </div>
        </div>
        <div style={{
          width: '128px',
          height: '8px',
          backgroundColor: '#10b981',
          borderRadius: '4px',
          margin: '16px auto 0'
        }} />
      </div>

      {/* Content */}
      <div style={{
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '20px',
        padding: '20px 0'
      }}>
        {/* Patterns Section */}
        {patterns.length > 0 && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '20px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '12px',
              color: '#a78bfa'
            }}>
              🤖 Insights de la IA:
            </h2>
            <ul style={{
              fontSize: '22px',
              lineHeight: '1.4',
              listStyle: 'none',
              padding: '0',
              margin: '0'
            }}>
              {patterns.map((pattern: string, index: number) => (
                <li key={index} style={{
                  marginBottom: '12px',
                  paddingLeft: '16px',
                  position: 'relative',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  lineHeight: '1.3'
                }}>
                  <span style={{
                    position: 'absolute',
                    left: '0',
                    top: '0'
                  }}>
                    •
                  </span>
                  {pattern}
                </li>
              ))}
            </ul>
            {recommendedGenres.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginTop: '16px'
              }}>
                {recommendedGenres.map((genre: string, index: number) => (
                  genre && (
                    <span key={index} style={{
                      background: 'rgba(147, 197, 253, 0.3)',
                      color: '#93c5fd',
                      padding: '8px 16px',
                      paddingBottom: '25px',
                      borderRadius: '20px',
                      fontSize: '22px',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      wordBreak: 'keep-all'
                    }}>
                      {genre}
                    </span>
                  )
                ))}
              </div>
            )}
          </div>
        )}

        {/* Roast Section */}
        {roast && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '20px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '12px',
              color: '#fca5a5'
            }}>
              🔥 Lo que la IA dice de mí:
            </h2>
            <p style={{
              fontSize: '22px',
              lineHeight: '1.5',
              margin: '0',
              fontStyle: 'italic',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}>
              {roast}
            </p>
          </div>
        )}

        {/* Personality Reading Section */}
        {personalityReading && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '20px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '12px',
              color: '#c4b5fd'
            }}>
              ✨ Mi horóscopo musical:
            </h2>
            <p style={{
              fontSize: '22px',
              lineHeight: '1.5',
              margin: '0',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}>
              {personalityReading}
            </p>
          </div>
        )}

        {/* Stats Section */}
        {userTaste?.stats && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '20px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '12px',
              color: '#93c5fd'
            }}>
              📊 Mis estadísticas:
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
              textAlign: 'center'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div style={{
                  fontSize: '36px',
                  fontWeight: '700',
                  lineHeight: '1',
                  color: '#10b981'
                }}>
                  {userTaste.stats.avgPopularity}%
                </div>
                <div style={{
                  fontSize: '24px',
                  opacity: '0.8',
                  marginTop: '4px'
                }}>
                  Popularidad
                </div>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div style={{
                  fontSize: '36px',
                  fontWeight: '700',
                  lineHeight: '1',
                  color: '#fbbf24'
                }}>
                  {userTaste.stats.avgEnergy}%
                </div>
                <div style={{
                  fontSize: '24px',
                  opacity: '0.8',
                  marginTop: '4px'
                }}>
                  Energía
                </div>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div style={{
                  fontSize: '36px',
                  fontWeight: '700',
                  lineHeight: '1',
                  color: '#f87171'
                }}>
                  {userTaste.stats.explicitRatio}%
                </div>
                <div style={{
                  fontSize: '24px',
                  opacity: '0.8',
                  marginTop: '4px'
                }}>
                  Explícito
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontSize: '24px',
          opacity: '0.7',
          margin: '0'
        }}>
          Generado con Spot-a-Lyst
        </p>
        <p style={{
          fontSize: '20px',
          opacity: '0.5',
          marginTop: '8px',
          margin: '8px 0 0 0'
        }}>
          spotify.com
        </p>
      </div>
    </div>
  );
};

export default RecommendationsImageCard; 