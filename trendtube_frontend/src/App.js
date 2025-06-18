import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Basic constants for theme colors
const COLORS = {
  primary: "#ff0000",
  secondary: "#000000",
  accent: "#f7f8f7",
};

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3";
const API_KEY = "AIzaSyAplX_Adv2vKd43NddKflZNWdfbh4yHWoU";

// Keep cache and rate limiter outside component to persist across renders
const cache = {};
let lastApiCallTimestamp = 0;
const RATE_LIMIT_DELAY = 900; // milliseconds between requests

// PUBLIC_INTERFACE
function App() {
  const [videos, setVideos] = useState([]);
  const [displayedVideos, setDisplayedVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInput = useRef(null);

  // Helper for applying cache/rate limiting to API fetches
  // PUBLIC_INTERFACE
  async function fetchWithRateLimiting(url, paramsKey) {
    // Cache hit
    if (cache[paramsKey]) {
      return cache[paramsKey];
    }

    // Basic rate limiter (delay between API requests)
    const now = Date.now();
    if (now - lastApiCallTimestamp < RATE_LIMIT_DELAY) {
      await new Promise((resolve) =>
        setTimeout(resolve, RATE_LIMIT_DELAY - (now - lastApiCallTimestamp))
      );
    }
    lastApiCallTimestamp = Date.now();

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    cache[paramsKey] = data; // Cache the result
    return data;
  }

  // PUBLIC_INTERFACE
  async function fetchTrendingVideos() {
    const params = new URLSearchParams({
      part: "snippet,contentDetails,statistics",
      chart: "mostPopular",
      maxResults: "24",
      regionCode: "US",
      key: API_KEY,
    });
    const cacheKey = "trending";
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithRateLimiting(
        `${YOUTUBE_API_URL}/videos?${params.toString()}`,
        cacheKey
      );
      if (data && Array.isArray(data.items)) {
        setVideos(data.items);
        setDisplayedVideos(data.items);
      } else {
        setError("No trending videos found.");
      }
    } catch (err) {
      setError(err.message || "Unable to fetch trending videos.");
    } finally {
      setLoading(false);
    }
  }

  // PUBLIC_INTERFACE
  async function fetchSearchVideos(query) {
    if (!query) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      part: "snippet",
      maxResults: "20",
      q: query,
      key: API_KEY,
      type: "video",
    });
    const cacheKey = `search_${query.trim().toLowerCase()}`;
    try {
      const data = await fetchWithRateLimiting(
        `${YOUTUBE_API_URL}/search?${params.toString()}`,
        cacheKey
      );
      if (data && Array.isArray(data.items)) {
        // Fetch additional details for each video for consistency
        const videoIds = data.items
          .map((item) => item.id.videoId)
          .filter(Boolean)
          .join(",");
        if (videoIds) {
          const detailsParams = new URLSearchParams({
            part: "snippet,contentDetails,statistics",
            id: videoIds,
            key: API_KEY,
          });
          const detailsCacheKey = `videoDetails_${videoIds}`;
          const detailsData = await fetchWithRateLimiting(
            `${YOUTUBE_API_URL}/videos?${detailsParams.toString()}`,
            detailsCacheKey
          );
          setVideos(detailsData.items || []);
          setDisplayedVideos(detailsData.items || []);
        } else {
          setDisplayedVideos([]);
        }
      } else {
        setError("No results found.");
        setDisplayedVideos([]);
      }
    } catch (err) {
      setError(err.message || "Unable to fetch search results.");
    } finally {
      setLoading(false);
    }
  }

  // Load trending on first render
  useEffect(() => {
    fetchTrendingVideos();
  }, []);

  // Handle submit for search form
  function handleSearchSubmit(e) {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      // Show trending again if search cleared
      setDisplayedVideos(videos);
      setError(null);
    } else {
      fetchSearchVideos(trimmed);
    }
  }

  // Handle clear search button
  function clearSearch() {
    setSearchTerm("");
    setDisplayedVideos(videos);
    setError(null);
    searchInput.current && searchInput.current.focus();
  }

  // Responsive style helpers
  const themeVars = {
    "--base-light": COLORS.primary,
    "--base-dark": COLORS.secondary,
    "--text-color": COLORS.secondary,
    "--text-secondary": "#444",
    "--border-color": "#eee",
    "--accent": COLORS.accent,
    background: COLORS.accent,
    color: COLORS.secondary,
  };

  return (
    <div className="app" style={themeVars}>
      <nav
        className="navbar"
        style={{
          background: COLORS.primary,
          color: "#fff",
          boxShadow: "0 2px 18px 0 rgba(0,0,0,0.08)",
        }}
      >
        <div className="container" style={{ flexDirection: "row" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              gap: 24,
            }}
          >
            <div className="logo" style={{ color: "#fff" }}>
              <span
                className="logo-symbol"
                style={{
                  color: "#fff",
                  background: COLORS.primary,
                  display: "inline-block",
                  width: 20,
                  height: 20,
                  textAlign: "center",
                }}
              >
                <svg height="18" width="20" fill={COLORS.primary} viewBox="0 0 20 18" aria-hidden="true" style={{ verticalAlign: "middle" }}>
                  <rect width="20" height="18" fill={COLORS.primary} rx="4" />
                  <polygon points="7,5 15,9 7,13" fill="#fff"/>
                </svg>
              </span>
              <span style={{ fontWeight: 700, letterSpacing: "0.03em", fontSize: 22, paddingLeft: 8 }}>
                TrendTube
              </span>
            </div>
            <form
              onSubmit={handleSearchSubmit}
              style={{
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                gap: 6,
                flex: 1,
                justifyContent: "flex-end",
              }}
              autoComplete="off"
              role="search"
            >
              <input
                ref={searchInput}
                type="text"
                name="search"
                value={searchTerm}
                placeholder="Search videos"
                aria-label="Search videos"
                style={{
                  padding: "7px 14px",
                  borderRadius: 20,
                  border: "1.5px solid #d4d4d4",
                  background: "#fff",
                  color: "#222",
                  fontSize: 16,
                  outline: "none",
                  maxWidth: 300,
                  width: "100%",
                  marginRight: 6,
                  boxShadow: "0 1px 3px 0 rgba(0,0,0,0.03)",
                  transition: "border-color .2s"
                }}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  title="Clear search"
                  onClick={clearSearch}
                  style={{
                    background: "#eee",
                    borderRadius: "50%",
                    border: "none",
                    color: "#777",
                    width: 28,
                    height: 28,
                    marginRight: 8,
                    cursor: "pointer",
                    fontSize: 17,
                  }}
                  tabIndex={0}
                >
                  &times;
                </button>
              )}
              <button
                className="btn"
                type="submit"
                style={{
                  background: COLORS.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 20,
                  fontWeight: 600,
                  fontSize: 16,
                  padding: "7px 18px",
                  marginLeft: 0,
                  cursor: "pointer",
                  letterSpacing: "0.01em",
                  minWidth: 80,
                  transition: "background .2s",
                }}
                aria-label="Search"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main>
        <div className="container" style={{ paddingTop: 120 }}>
          <div className="hero" style={{ minHeight: 200 }}>
            <div
              className="subtitle"
              style={{
                color: COLORS.primary,
                fontWeight: 500,
                fontSize: 20,
                textShadow: "0 2px 12px #fff8",
              }}
            >
              Trending on YouTube
            </div>
            <h1 className="title" style={{ color: COLORS.secondary, fontSize: "2.5rem" }}>
              US Popular Videos
            </h1>
            <div className="description" style={{ color: "#333" }}>
              Discover and search the latest trending videos across YouTube, updated live.
            </div>
          </div>

          {/* Loading, error, or results */}
          {loading ? (
            <div
              className="description"
              style={{
                textAlign: "center",
                fontSize: 20,
                marginTop: 52,
                color: COLORS.primary,
              }}
              aria-busy="true"
            >
              Loading...
            </div>
          ) : error ? (
            <div
              className="description"
              style={{
                textAlign: "center",
                fontSize: 18,
                marginTop: 52,
                color: COLORS.primary,
              }}
              role="status"
              aria-live="polite"
            >
              {error}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "32px",
                marginTop: 20,
                paddingBottom: 50,
              }}
              role="list"
              aria-label="trending videos"
            >
              {displayedVideos.length === 0 ? (
                <div style={{
                  gridColumn: "1/-1",
                  textAlign: "center",
                  background: "#fff0f0",
                  color: "#a70000",
                  padding: 28,
                  fontWeight: 500,
                  borderRadius: 8,
                  fontSize: 19
                }}>
                  No results found.
                </div>
              ) : (
                displayedVideos.map((video) => (
                  <VideoCard video={video} key={video.id} />
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// PUBLIC_INTERFACE
function VideoCard({ video }) {
  // Handles both search results (maybe id.videoId) and trending (id)
  const videoId = video.id && typeof video.id === "object"
    ? video.id.videoId
    : video.id;

  const title = video.snippet?.title || "Untitled";
  const channel = video.snippet?.channelTitle || "Unknown Channel";
  const thumb =
    video.snippet?.thumbnails?.medium?.url ||
    video.snippet?.thumbnails?.default?.url ||
    video.snippet?.thumbnails?.high?.url;

  return (
    <div
      className="video-card"
      style={{
        background: "#fff",
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid #ececec",
        boxShadow: "0 2px 16px rgba(24,24,24,0.04)",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow .14s",
        minWidth: 0,
        minHeight: 0,
      }}
      tabIndex={0}
      aria-label={title}
    >
      <a
        href={`https://www.youtube.com/watch?v=${videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", color: "inherit", display: "block" }}
        tabIndex={-1}
      >
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#eee" }}>
          {thumb ? (
            <img
              src={thumb}
              alt={title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                aspectRatio: "16/9",
                display: "block",
                transition: "transform .13s",
              }}
              loading="lazy"
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "#e7e7e7" }} />
          )}
        </div>
        <div style={{ padding: "12px 16px", minHeight: 72, background: "#fff" }}>
          <div
            className="videotitle"
            style={{
              fontWeight: 700,
              fontSize: "1.1rem",
              marginBottom: 4,
              color: "#222",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
              lineHeight: 1.2,
              width: "100%",
            }}
            title={title}
          >
            {title}
          </div>
          <span style={{ color: "#888", fontSize: 14 }}>{channel}</span>
        </div>
      </a>
    </div>
  );
}

export default App;
