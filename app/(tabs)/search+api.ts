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

    let intersect_songs: number[] = get_songs(mood, time);

    let ranked_songs: number[] = rank_songs(intersect_songs);

    let spotify_codes: string[] = [];

    for(let i = 0; i < MAX_RESULTS; i++)
    {
        spotify_codes.push(fs.spotify_ids[ranked_songs[i]]);
    }
    console.log(spotify_codes);

    let spotify_data: SpotifyAPITrack[] = await get_all_tracks(spotify_codes);

    let results: SearchResult[] = []

    for(let i = 0; i < spotify_data.length; i++)
    {
        let result: SearchResult = {
            track_name:spotify_data[i].name,
            album_name:spotify_data[i].album.name,
            artists:spotify_data[i].artists[0].name
        }
        results.push(result);
    }

    return new Response(JSON.stringify({results}));
}

function get_songs(mood: string, time: string): number[]{
    let mood_songs: number[] = index.mood[mood];
    let time_songs: number[] = index.time[time];

    let intersect: number[] = mood_songs.filter(song => time_songs.includes(song));

    return intersect;
}

function rank_songs(songs: number[]): number[]{
    // TODO: Implement ranking. Return array of doc ids
    return songs
}

async function get_access_token(): Promise<string>{
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

async function get_track(id: string, token: string): Promise<SpotifyAPITrack>{
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

async function get_all_tracks(ids: string[]): Promise<SpotifyAPITrack[]>{
    const token = await get_access_token();

    let tracks = await Promise.all(
        ids.map(id => get_track(id, token))
    );

    console.log(tracks);
    return tracks
}