import React, { useEffect, useState } from 'react';
import './App.css';

// PUBLIC_INTERFACE
function App() {
  // State for trending videos, loading and error
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // YouTube Data API integration
  useEffect(() => {
    // For real-world use, store the API key securely in an environment variable or backend,
    // but for simplicity and task instructions, we use it inline for now.
    // API Key must not be committed to public repos.
    const API_KEY = "AIzaSyAplX_Adv2vKd43NddKflZNWdfbh4yHWoU";
    const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/videos";
    const params = new URLSearchParams({
      part: "snippet,contentDetails,statistics",
      chart: "mostPopular",
      maxResults: "20",
      regionCode: "US",
      key: API_KEY,
    });

    async function fetchTrendingVideos() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${YOUTUBE_API_URL}?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        if (data && Array.isArray(data.items)) {
          setVideos(data.items);
        } else {
          setError("No trending videos found.");
        }
      } catch (err) {
        setError(err.message || "Unable to fetch trending videos.");
      } finally {
        setLoading(false);
      }
    }

    fetchTrendingVideos();
    // Optionally re-fetch logic (interval or manual refresh) could be added here

    // No cleanup needed for this simple fetch
  }, []);

  return (
    <div className="app">
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo">
              <span className="logo-symbol">*</span> TrendTube
            </div>
            <button className="btn" disabled>
              Trending
            </button>
          </div>
        </div>
      </nav>

      <main>
        <div className="container" style={{ paddingTop: 120 }}>
          <div className="hero" style={{ minHeight: 300 }}>
            <div className="subtitle">Trending on YouTube</div>
            <h1 className="title">US Popular Videos</h1>
            <div className="description">
              Enjoy the latest trending content across YouTube, updated live.
            </div>
          </div>
          {/* Loading, error, or success states */}
          {loading ? (
            <div className="description" style={{ textAlign: "center", fontSize: 20, marginTop: 48 }}>Loading trending videos...</div>
          ) : error ? (
            <div className="description" style={{ color: "#ff0000", textAlign: "center", fontSize: 18, marginTop: 48 }}>
              {error}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '32px',
                marginTop: 32,
                paddingBottom: 48,
              }}
              role="list"
              aria-label="trending videos"
            >
              {videos.map((video) => (
                <div key={video.id} style={{ background: 'rgba(8,8,32,0.3)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <img
                      src={video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url}
                      alt={video.snippet?.title}
                      style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }}
                    />
                    <div style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, fontSize: "1.12rem", marginBottom: 4, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                        {video.snippet?.title}
                      </div>
                      <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                        {video.snippet?.channelTitle}
                      </span>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;