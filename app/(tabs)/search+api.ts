/*
API needs to return data in the form:
{
    track_name: 'Mock Song 1',
    album_name: 'Mock Album 1',
    artists: 'Mock Artist 1',
}
*/
import { fs, index } from "../data";
const MAX_RESULTS: number = 3;

type SearchData = {
  mood: string;
  time: string;
  settings: {
    favoriteArtists: string[];
    favoriteGenres: string[];
    userVector: number[];
  };
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
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  const data: SearchData = await request.json();

  if(!token) throw new Error("User not authenticated with Spotify");

  let mood: string = data.mood.toLowerCase();
  let time: string = data.time.toLowerCase();
  let artistPref: string[] = data.settings.favoriteArtists;
  let genrePref: string[] = data.settings.favoriteGenres;
  let userVector: number[] = data.settings.userVector;

  console.log("User Vector:");
  console.log(userVector);

  let intersect_songs: number[] = get_songs(mood, time);

  let ranked_songs: number[] = rank_songs(intersect_songs);

  let spotify_codes: string[] = [];

  for (let i = 0; i < MAX_RESULTS; i++) {
    spotify_codes.push(fs.spotify_ids[ranked_songs[i]]);
  }

  let spotify_data: SpotifyAPITrack[] = await get_all_tracks(
    spotify_codes,token
  );

  let results: SearchResult[] = [];

  for (let i = 0; i < spotify_data.length; i++) {
    let result: SearchResult = {
      track_name: spotify_data[i].name,
      album_name: spotify_data[i].album.name,
      artists: spotify_data[i].artists[0].name,
    };
    results.push(result);
  }

  return new Response(JSON.stringify({ results }));
}

function get_songs(mood: string, time: string): number[] {
  let mood_songs: number[] = index.mood[mood];
  let time_songs: number[] = index.time[time];

  let intersect: number[] = mood_songs.filter((song) =>
    time_songs.includes(song),
  );

  return intersect;
}

function rank_songs(songs: number[]): number[] {
  // TODO: Implement ranking. Return array of doc ids
  return songs;
}

async function get_track(id: string, token: string): Promise<SpotifyAPITrack | null> {
  const response = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error(`Spotify API error for track ${id}: ${response.status}`);
    return null;
  }

  return response.json();
}

async function get_all_tracks(ids: string[], token: string): Promise<SpotifyAPITrack[]> {
  let results = await Promise.all(ids.map((id) => get_track(id, token)));

  return results.filter((t): t is SpotifyAPITrack => t !== null);
}
