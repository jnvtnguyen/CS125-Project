/*
    Loads the data into objects to give to the API (search+api.ts)

    InvertedIndex:
    - index.mood["mood"] returns all doc IDs of songs with the mood "mood"
    - index.time["time"] returns all doc IDs of songs with the time "time"
    - index.artist["artist"] returns all doc IDs of songs with artist "artist"
    - index.album["album|artist"] returns all doc IDs of songs with album "album" w/ artist "artist"
        * MUST INCLUDE BOTH ALBUM AND ARTIST SEPARATED BY '|'
    - index.track["track"] returns all doc IDs of songs that contain "track" in the title
        * Only exact word matches, no tf-idf ranking
    - index.genre["genre"] returns all doc IDs of songs with the genre "genre"

    FeatureStore:
    - fs.vectors[docID] returns the feature vector of the song with doc ID given
        * Vector is in the order of [danceability, energy, loudness, speechiness, acousticness, instrumentalness, valence, tempo]
    - fs.spotify_ids[docID] returns the spotify API ID of the song with the ID given 

*/
import fsJSON from "../Index/fstore.json";
import indexJSON from "../Index/index.json";


type InvertedIndex = {
  [field: string]: {
    [term: string]: number[];
  };
};

type FeatureStore = {
  vectors: number[][];
  spotify_ids: string[];
};

export const index: InvertedIndex = indexJSON as InvertedIndex;
export const fs: FeatureStore = fsJSON as FeatureStore;