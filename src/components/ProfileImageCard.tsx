import React from 'react';

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

interface ProfileImageCardProps {
  data: ProfileImageData;
}

const ProfileImageCard: React.FC<ProfileImageCardProps> = ({ data }) => {
  const { userInfo, topTracks, topArtists, timeRange, recentTracks } = data;
  
  const timeRangeLabels = {
    'short_term': 'Últimas 4 semanas',
    'medium_term': 'Últimos 6 meses', 
    'long_term': 'Desde siempre'
  };

  return (
    <div 
      className="profile-image-card"
      style={{
        fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
        width: '1600px',
        height: '2000px',
        background: 'linear-gradient(135deg, #1db954 0%, #1ed760 50%, #0d7d3a 100%)',
        color: 'white',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
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
      <div style={{
        textAlign: 'center',
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        borderRadius: '32px',
        padding: '32px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          {userInfo?.imageUrl && (
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              border: '6px solid #1ed760',
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
              fontSize: '56px',
              fontWeight: '700',
              margin: '0',
              wordBreak: 'keep-all',
              hyphens: 'none'
            }}>
               {userInfo?.name || 'Mi Perfil de Spotify'}
            </h1>
            {userInfo?.email && (
              <p style={{
                fontSize: '32px',
                opacity: '0.9',
                margin: '8px 0 0 0'
              }}>
                {userInfo.email}
              </p>
            )}
          </div>
        </div>
        <div style={{
          background: 'rgba(30, 215, 96, 0.2)',
          color: '#1ed760',
          padding: '16px 32px',
          borderRadius: '40px',
          fontSize: '28px',
          fontWeight: '600',
          display: 'inline-block',
          marginTop: '12px'
        }}>
          {timeRangeLabels[timeRange]}
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: '1',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '32px'
      }}>
        {/* Top Tracks */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '32px',
          height: 'fit-content'
        }}>
          <h2 style={{
            fontSize: '36px',
            fontWeight: '700',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            🎤 Top Canciones
          </h2>
          {topTracks.slice(0, 5).map((track, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              minHeight: '100px'
            }}>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                marginRight: '24px',
                color: '#1ed760',
                minWidth: '40px'
              }}>
                {index + 1}
              </div>
              {track.imageUrl ? (
                <img 
                  src={track.imageUrl} 
                  alt={track.name} 
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '12px',
                    marginRight: '24px',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '12px',
                  marginRight: '24px',
                  background: 'rgba(255, 255, 255, 0.1)'
                }} />
              )}
              <div style={{ flex: '1', paddingRight: '16px' }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  lineHeight: '1.6',
                  paddingTop: '4px',
                  paddingBottom: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {track.name.length > 25 ? track.name.substring(0, 25) + '...' : track.name}
                </div>
                <div style={{
                  fontSize: '28px',
                  opacity: '0.8',
                  lineHeight: '1.6',
                  paddingTop: '4px',
                  paddingBottom: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {track.artist.length > 30 ? track.artist.substring(0, 30) + '...' : track.artist}
                </div>
              </div>
              <div style={{
                fontSize: '24px',
                color: '#1ed760',
                fontWeight: '600'
              }}>
                {track.popularity}%
              </div>
            </div>
          ))}
        </div>

        {/* Top Artists */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '32px',
          height: 'fit-content'
        }}>
          <h2 style={{
            fontSize: '36px',
            fontWeight: '700',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            🎨 Top Artistas
          </h2>
          {topArtists.slice(0, 5).map((artist, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              minHeight: '100px'
            }}>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                marginRight: '24px',
                color: '#1ed760',
                minWidth: '40px'
              }}>
                {index + 1}
              </div>
              {artist.imageUrl ? (
                <img 
                  src={artist.imageUrl} 
                  alt={artist.name} 
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '12px',
                    marginRight: '24px',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '12px',
                  marginRight: '24px',
                  background: 'rgba(255, 255, 255, 0.1)'
                }} />
              )}
              <div style={{ flex: '1', paddingRight: '16px' }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  lineHeight: '1.6',
                  paddingTop: '4px',
                  paddingBottom: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {artist.name.length > 25 ? artist.name.substring(0, 25) + '...' : artist.name}
                </div>
                <div style={{
                  fontSize: '28px',
                  opacity: '0.8',
                  lineHeight: '1.6',
                  paddingTop: '4px',
                  paddingBottom: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {artist.genres.slice(0, 2).join(', ').length > 30 ? 
                    artist.genres.slice(0, 2).join(', ').substring(0, 30) + '...' : 
                    artist.genres.slice(0, 2).join(', ')}
                </div>
              </div>
              <div style={{
                fontSize: '24px',
                color: '#1ed760',
                fontWeight: '600'
              }}>
                {artist.popularity}%
              </div>
            </div>
          ))}
        </div>

        {/* Recent Tracks */}
        {recentTracks.length > 0 && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            padding: '32px',
            gridColumn: '1 / -1'
          }}>
            <h2 style={{
              fontSize: '36px',
              fontWeight: '700',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              🕒 Escuchadas Recientemente
            </h2>
            {recentTracks.slice(0, 3).map((track, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '16px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                minHeight: '80px'
              }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  marginRight: '24px',
                  color: '#1ed760',
                  minWidth: '30px'
                }}>
                  {index + 1}
                </div>
                {track.imageUrl ? (
                  <img 
                    src={track.imageUrl} 
                    alt={track.name} 
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      marginRight: '16px',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    marginRight: '16px',
                    background: 'rgba(255, 255, 255, 0.1)'
                  }} />
                )}
                <div style={{ flex: '1', paddingRight: '16px' }}>
                  <div style={{
                    fontSize: '26px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    lineHeight: '1.6',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {track.name.length > 30 ? track.name.substring(0, 30) + '...' : track.name}
                  </div>
                  <div style={{
                    fontSize: '22px',
                    opacity: '0.8',
                    lineHeight: '1.6',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {track.artist.length > 35 ? track.artist.substring(0, 35) + '...' : track.artist}
                  </div>
                </div>
                {track.playedAt && (
                  <div style={{
                    fontSize: '20px',
                    color: '#1ed760',
                    fontWeight: '600'
                  }}>
                    {new Date(track.playedAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '16px'
      }}>
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
          🎵 Tu música, tu historia
        </p>
      </div>
    </div>
  );
};

export default ProfileImageCard; 