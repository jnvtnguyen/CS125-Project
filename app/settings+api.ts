/*
Feature vectors take the form of:
[danceability, energy, loudness, speechiness, acousticness, instrumentalness, valence, tempo]
All values are normalized
*/


export async function POST(request: Request) {
    const token = parseBearerToken(request.headers);
    if (!token) {
      return new Response(JSON.stringify({ error: "Not authenticated with Spotify." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { artists, genres } = await get_top_artists_and_genres(token);
    const user_vector = await get_user_vector(token);

    return new Response(JSON.stringify({ artists, genres, user_vector}), {
    headers: { "Content-Type": "application/json" },
    });
}

function parseBearerToken(headers: Headers): string | null {
  const raw = headers.get("Authorization");
  if (!raw) return null;

  const match = raw.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1].trim();
  if (!token || token === "null" || token === "undefined") return null;
  return token;
}


async function get_top_artists_and_genres(token: string): Promise<{artists: string[]; genres: string[];}> {
    const response = await fetch(
    `https://api.spotify.com/v1/me/top/artists`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
    );
    let artists = [];
    let genres_temp = [];

    const data = await response.json();
    for (const artist of data.items)
    {
        artists.push(artist.name);
        for(const genre of artist.genres ?? []) genres_temp.push(genre)
    }
    let genres = [...new Set(genres_temp)];
    return {artists, genres};
}

async function get_top_songs(token:string): Promise<string[]> {
  const response = await fetch(
    `https://api.spotify.com/v1/me/top/tracks?limit=50`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  let spotify_ids: string[] = [];
  const data = await response.json();
  for (const song of data.items)
  {
      spotify_ids.push(song.id)
  }

  return spotify_ids
} 

async function get_song_array(spotify_id: string): Promise<number[]> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new Error("RAPIDAPI_KEY not set. Please set this in the .env file.");

  const response = await fetch(
    `https://spotify-extended-audio-features-api.p.rapidapi.com/v1/audio-features/` + spotify_id,
    {
      headers: {
        'x-rapidapi-key': key,
		    'x-rapidapi-host': 'spotify-extended-audio-features-api.p.rapidapi.com'
      }
    }
  );

  const data = await response.json();
  const danceability: number = data.danceability;
  const energy: number = data.energy;
  let loudness: number = data.loudness;
  const speechiness: number = data.speechiness;
  const acousticness: number = data.acousticness;
  const instrumentalness: number = data.instrumentalness;
  const valence: number = data.valence;
  let tempo: number = data.tempo;

  loudness = (loudness + 60) / 60; //between -60 and 0 db
  tempo = (tempo - 50) / 150; //between 50 and ~200
  if(tempo > 1) tempo = 1;

  return [danceability, energy, loudness, speechiness, acousticness, instrumentalness, valence, tempo];
} 

async function get_user_vector(token: string): Promise<number[]> {
    const top_song_spotify_ids: string[] = await get_top_songs(token);
    let user_vector: number[] = new Array(8).fill(0);
    let total_weight = 0

    //fetch in parallel now
    const song_vectors: (number[])[] = await Promise.all(
        top_song_spotify_ids.map(id => get_song_array(id))
    );

    song_vectors.forEach((song_vector, rank) => {
      if (!is_valid_vector(song_vector)) return;

      //logarithmic decay to weight higher ranked songs more
      const weight = 1 / Math.log2(rank + 2);

      for (let i = 0; i < 8; i++) user_vector[i] += song_vector[i] * weight;
      
      total_weight += weight;
    });

    //normalize back to [0,1]
    const user_vector_normalized = user_vector.map(val => val / total_weight);

    return user_vector_normalized;
}

function is_valid_vector(vector: number[]): boolean {
    return vector.every(val => typeof val === 'number' && !isNaN(val));
}
