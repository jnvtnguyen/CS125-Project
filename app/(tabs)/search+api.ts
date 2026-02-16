/*
API needs to return data in the form:
{
    track_name: 'Mock Song 1',
    album_name: 'Mock Album 1',
    artists: 'Mock Artist 1',
}
*/
import { fs, index } from "../data";
const MAX_RESULTS: number = 15;

// Ideal feature vectors per mood
// Vector order: [danceability, energy, loudness, speechiness, acousticness, instrumentalness, valence, tempo]
const MOOD_VECTORS: { [mood: string]: number[] } = {
  energetic: [0.75, 0.85, 0.80, 0.10, 0.10, 0.00, 0.60, 0.80],
  melancholic: [0.30, 0.25, 0.40, 0.05, 0.75, 0.10, 0.15, 0.30],
  calm: [0.35, 0.20, 0.30, 0.05, 0.80, 0.20, 0.40, 0.25],
  intense: [0.40, 0.90, 0.90, 0.15, 0.10, 0.05, 0.20, 0.75],
  happy: [0.70, 0.70, 0.65, 0.10, 0.20, 0.00, 0.90, 0.65],
  focused: [0.40, 0.50, 0.50, 0.05, 0.40, 0.80, 0.40, 0.50],
  party: [0.85, 0.80, 0.75, 0.10, 0.10, 0.00, 0.75, 0.70],
  romantic: [0.45, 0.30, 0.40, 0.05, 0.70, 0.05, 0.50, 0.35],
};

type SearchData = {
  mood: string;
  time: string;
  settings: {
    favoriteArtists: string[];
    favoriteGenres: string[];
  }
};

type SearchResult = {
  track_name: string;
  album_name: string;
  artists: string;
};

type SpotifyAPITrack = {
  id: string;
  name: string;
  duration_ms: number;
  preview_url: string | null;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string; width: number; height: number }[];
  };
  external_urls: {
    spotify: string;
  };
};

export async function POST(request: Request) {
  const data: SearchData = await request.json();

  let mood: string = data.mood.toLowerCase();
  let time: string = data.time.toLowerCase();

  // Step 1: Get all songs matching mood + time
  let all_candidates: number[] = get_songs(mood, time);

  // Step 2: Narrow down to songs from favorite artists/genres if possible
  let candidates = narrow_by_preferences(all_candidates, data.settings);

  // Step 3: Rank by cosine similarity to the ideal mood vector
  let ranked_songs: number[] = rank_songs(candidates, mood);

  let spotify_codes: string[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < ranked_songs.length && spotify_codes.length < MAX_RESULTS; i++) {
    const id = fs.spotify_ids[ranked_songs[i]];
    if (!seen.has(id)) {
      seen.add(id);
      spotify_codes.push(id);
    }
  }

  let spotify_data: SpotifyAPITrack[] = await get_all_tracks(spotify_codes);

  let results: SearchResult[] = [];
  const seenTracks = new Set<string>();

  for (let i = 0; i < spotify_data.length; i++) {
    const trackKey = spotify_data[i].name.toLowerCase();
    if (seenTracks.has(trackKey)) continue;
    seenTracks.add(trackKey);

    let result: SearchResult = {
      track_name: spotify_data[i].name,
      album_name: spotify_data[i].album.name,
      artists: spotify_data[i].artists[0].name
    }
    results.push(result);
  }

  return new Response(JSON.stringify({ results }));
}

function get_songs(mood: string, time: string): number[] {
  let mood_songs: number[] = index.mood[mood];
  let time_songs: number[] = index.time[time];

  let intersect: number[] = mood_songs.filter(song => time_songs.includes(song));

  return intersect;
}

function narrow_by_preferences(songs: number[], settings: SearchData['settings']): number[] {
  // Build a set of doc IDs from favorite artists and genres
  const preferredDocIds = new Set<number>();

  for (const artist of settings?.favoriteArtists ?? []) {
    const docs = index.artist[artist.toLowerCase()];
    if (docs) docs.forEach(id => preferredDocIds.add(id));
  }

  for (const genre of settings?.favoriteGenres ?? []) {
    const docs = index.genre[genre.toLowerCase()];
    if (docs) docs.forEach(id => preferredDocIds.add(id));
  }

  // If no preferences set, return all candidates
  if (preferredDocIds.size === 0) return songs;

  // Filter to only songs that match preferences
  const narrowed = songs.filter(id => preferredDocIds.has(id));

  // If we have enough narrowed results, use them; otherwise fall back to all
  return narrowed.length >= MAX_RESULTS ? narrowed : songs;
}

function cosine_similarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

function rank_songs(songs: number[], mood: string): number[] {
  const idealVector = MOOD_VECTORS[mood] ?? [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

  const scored = songs.map(docId => ({
    docId,
    score: cosine_similarity(fs.vectors[docId], idealVector),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.map(s => s.docId);
}

async function get_access_token(): Promise<string> {
  let response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(
        process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
      ).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });

  let data = await response.json();
  return data.access_token;
}

async function get_track(id: string, token: string): Promise<SpotifyAPITrack> {
  const response = await fetch(
    `https://api.spotify.com/v1/tracks/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.json();
}

async function get_all_tracks(ids: string[]): Promise<SpotifyAPITrack[]> {
  const token = await get_access_token();

  let tracks = await Promise.all(
    ids.map(id => get_track(id, token))
  );

  console.log(tracks);
  return tracks
}