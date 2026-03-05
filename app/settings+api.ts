export async function POST(request: Request) {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if(!token) throw new Error("User not authenticated with Spotify");

    const { artists, genres } = await get_top_artists_and_genres(token);
    console.log(artists);
    console.log(genres);

    return new Response(JSON.stringify({ artists, genres }), {
    headers: { "Content-Type": "application/json" },
    });

    //const vector: number[] = await get_user_vector(token);
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
        for(const genre of artist.genres) genres_temp.push(genre)
    }
    let genres = [...new Set(genres_temp)];
    return {artists, genres};
}

async function get_user_vector(token: string): Promise<number[]> {
    const response = await fetch(
    `https://api.spotify.com/v1/me/top/tracks`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
    );

    return response.json();
}
