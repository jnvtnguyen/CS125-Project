'''
The CSV data is split into two separate parts: the index, and the feature store.

Index:
    - Can be queried on time (morning, afternoon, evening, night)
    - Can be queried on mood (energetic, melancholic, calm, intense, happy, focused, party, romantic)
    - Can be queried by artist name (normalized; used for "more from this artist")
    - Can be queried by album; needs (album name, artist name) (normalized; used for "more from this album")
    - Can be queried by song name (only exact words for now, no tf-idf)
    - Can be queried by genre (all 125 genres listed in csv files)
    - Example query: Index.time["morning"] --> return all row IDs for songs that should be played in the morning

Feature Store:
    - Match by row ID (index will return row ID)
    - FeatureStore.vectors will return [danceability, energy, loudness, speechiness, acousticness, instrumentalness, valence, tempo]
    - FeatureStore.spotify_ids will return [song_id]
    - song_id is the spotify track id used for API calls
    - Use [danceability, energy, loudness, speechiness, acousticness, instrumentalness, valence, tempo] for cosine similarity
        *All values are normalized between 0-1
    - Example query 1: FeatureStore.vectors[12] --> return audio features for song w/ row ID 12
    - Example query 2: FeatureStore.spotify_ids[12] --> return spotify id for song w/ row ID 12
'''

import csv
import json
import tokenization

DATASET_FILE = "Data Processing/song_data.csv"
INDEX_FILE = "Index/index.json"
FEAT_STORE_FILE = "Index/fstore.json"

time_dict = dict()
mood_dict = dict()
artist_dict = dict()
album_dict = dict()
track_dict = dict()
genre_dict = dict()
index_dict = dict()

feature_vectors = []
spotify_ids = []

def generate_index_dicts():
    with open(DATASET_FILE, mode='r', newline='', encoding='utf-8') as data:
        dataset_reader = csv.DictReader(data)

        for song in dataset_reader:
            doc_id = int(song['row_id'])
            track_name = song['track_name']
            album_name = song['album_name']
            artists = song['artists'].split(';') #artists is list separated by ';'
            genre_name = song['track_genre']
            moods = song['moods'].split('-') #moods is list separated by '-'
            times = song['times'].split('-') #time is list separated by '-'

            song_id = song['track_id']
            danceability = float(song['danceability'])
            energy = float(song['energy'])
            loudness = float(song['loudness'])
            speechiness = float(song['speechiness'])
            acousticness = float(song['acousticness'])
            instrumentalness = float(song['instrumentalness'])
            valence = float(song['valence'])
            tempo = float(song['tempo'])

        
            build_time_index(doc_id, times)
            build_mood_index(doc_id, moods)
            build_artist_index(doc_id, artists)
            build_album_index(doc_id, album_name, artists)
            build_track_index(doc_id, track_name)
            build_genre_index(doc_id, genre_name)

            build_feature_store(doc_id, song_id, danceability, energy, loudness, speechiness, acousticness, instrumentalness, valence, tempo)

def build_time_index(doc_id, times):
    #time of day is already normalized
    for time in times:
        if time not in time_dict.keys():
            time_dict[time] = [doc_id]
        
        else: time_dict[time].append(doc_id)

def build_mood_index(doc_id, moods):
    for mood in moods:
        if mood not in mood_dict.keys():
            mood_dict[mood] = [doc_id]

        else: mood_dict[mood].append(doc_id)

def build_artist_index(doc_id, artists):
    for artist in artists:
        artist_normalized = artist.lower().strip();
        if artist_normalized not in artist_dict.keys():
            artist_dict[artist_normalized] = [doc_id]

        else: artist_dict[artist_normalized].append(doc_id)
    
def build_album_index(doc_id, album_name, artists):
    album_name_normalized = album_name.lower().strip()
    artist_normalized = artists[0].lower().strip()
    album = f"{album_name_normalized}|{artist_normalized}"

    if album not in album_dict.keys():
        album_dict[album] = [doc_id]
    
    else: album_dict[album].append(doc_id)


def build_track_index(doc_id, track_name):
    tokens = tokenization.tokenize_text(track_name)

    for token in tokens:
        if token not in track_dict.keys():
            track_dict[token] = [doc_id]
        
        else: track_dict[token].append(doc_id)


def build_genre_index(doc_id, genre_name):
    #genre_name already normalized in dataset
    if genre_name not in genre_dict.keys():
        genre_dict[genre_name] = [doc_id]

    else: genre_dict[genre_name].append(doc_id)

def build_feature_store(doc_id, song_id, danceability, energy, loudness, speechiness, acousticness, instrumentalness, valence, tempo):
    #normalize attributes to values between 0-1 
    loudness = (loudness + 60) / 60 #between -60 and 0 db
    tempo = (tempo - 50) / 150 #between 50 and ~200
    if tempo > 1: tempo = 1

    feature_vectors.append([danceability, energy, loudness, speechiness, acousticness, instrumentalness, valence, tempo])
    spotify_ids.append(song_id)
    
def generate_main_index():
    index_dict["time"] = time_dict
    index_dict["mood"] = mood_dict
    index_dict["artist"] = artist_dict
    index_dict["album"] = album_dict
    index_dict["track"] = track_dict
    index_dict["genre"] = genre_dict


def offload(obj, file):
    with open(file, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False)
        #add parameter "index=X" to make the json readable for debugging
    

if __name__ == "__main__":
    generate_index_dicts()
    generate_main_index()
    offload(index_dict, INDEX_FILE)

    feature_store = { "vectors": feature_vectors, "spotify_ids": spotify_ids }
    offload(feature_store, FEAT_STORE_FILE)