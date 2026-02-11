import { fs, index } from "../data";

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

    console.log(index.time["evening"]);
    console.log(fs.vectors[1])

    return new Response(JSON.stringify({
        results: []
    }));
}