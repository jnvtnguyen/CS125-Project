type SearchData = {
    mood: string;
    time: string;
    settings: {
        favoriteArtists: string[];
        favoriteGenres: string[];
    }
}

export async function POST(request: Request) {
    // TODO: Implement Index Search
    const data: SearchData = await request.json();

    return new Response(JSON.stringify({
        results: []
    }));
}