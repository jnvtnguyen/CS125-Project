'''
Moods:
    Energetic - High energy songs with higher tempo and good danceability
    Melancholic - Sad (low valence) songs with low energy
    Calm - Slower tempo, acoustic songs with low energy
    Intense - Negative, high energy songs that are loud
    Happy - Upbeat (high valence) songs with good energy
    Focused - Songs for studying; Very little to no lyrics (high instrumental, low speech attributes)
    Party - Very danceable, happy songs with mid to high energy
    Romantic - Not overly happy or sad songs with lots of lyrics and acoustics

Times:
    Morning (4am - 12pm): For waking up or commuting to work
        - Mid to high energy & positive vibes; not overly loud
        - Energetic, Happy, Focused moods apply here
    Afternoon (12pm - 6pm): For peak activity including working out and partying
        - High energy, very high/low valence & danceable music
        - Party, Energetic, Intense moods apply here
    Evening (6pm - 10pm): For winding down and relaxing
        - Low energy, could be either happy or sad 
        - Calm, Romantic, Focused moods apply here
    Night (10pm - 4am): For sleeping OR late night parties
        - Very low energy & tempo (sleep) or very high energy and loudness (party)
        - Calm/Focused (sleep) or Party/Energetic (party) moods apply here
'''

import csv

def csv_data_analysis():
    with open("Data Processing/raw_data.csv", mode='r', newline='', encoding='utf-8') as dataset, open("Data Processing/song_data.csv", mode='w', newline='', encoding='utf-8') as output:
        #header column, with new rows we will calculate
        fieldnames = ["row_id","track_id","artists","album_name","track_name","popularity","duration_ms","explicit","danceability","energy","key","loudness","mode",
                                "speechiness","acousticness","instrumentalness","liveness","valence","tempo","time_signature","track_genre", "moods", "times"]
        
        dataset_reader = csv.DictReader(dataset)
        output_writer = csv.DictWriter(output, fieldnames)
        
        output_writer.writeheader()
        
        for song in dataset_reader:
            mood = calculate_mood(float(song['danceability']), float(song['energy']), float(song['loudness']), float(song['speechiness']),
                                    float(song['acousticness']), float(song['instrumentalness']), float(song['valence']), float(song['tempo']))
            song['moods'] = mood

            time_of_day = calculate_time(float(song['danceability']), float(song['energy']), float(song['loudness']), 
                                            float(song['acousticness']), float(song['valence']), float(song['tempo']), mood)
            song['times'] = time_of_day

            output_writer.writerow(song)
    return

def calculate_mood(danceability, energy, loudness, speechiness, acousticness, instrumentalness, valence, tempo):
    #normalize values to value between 0 and 1
    loudness = (loudness + 60) / 60 #between -60 and 0 db
    tempo = (tempo - 50) / 150 #between 50 and 200
    if tempo > 1: tempo = 1

    energetic = ("energetic", (energy * (1.0 if energy < 0.8 else 1.15) * 0.35) + (tempo * 0.25) + (danceability * 0.25) + ((1 - acousticness) * 0.1) + (valence * 0.05))

    melancholic = ("melancholic", ((1 - valence) * 0.4) + ((1 - energy) * 0.2) + (acousticness * 0.2) + ((1 - danceability) * 0.2))

    calm = ("calm", ((1 - energy) * 0.3) + ((1 - loudness) * 0.2) + (acousticness * 0.3) + ((1 - tempo) * 0.2))

    intense = ("intense", ((energy * ((1 - valence) if valence > 0.6 else 1.0) * 0.35) + (loudness * 0.25) + ((1 - danceability) * 0.25) + 
            ((speechiness * 0.5 + (1 - acousticness) * 0.5) * 0.15)))
    
    happy = ("happy", (valence * (1.2 if valence > 0.7 else 1.0) * 0.55) + (energy * 0.25) + ((1 - acousticness) * 0.2))

    focused = ("focused", (instrumentalness * 0.4) + ((1 - speechiness) * 0.3) + ((1 - abs(energy - 0.5) * 2) * 0.3))

    party = ("party", (danceability * 0.35) + ((energy if energy > 0.5 else energy * 0.6) * 0.35) + ((valence if valence > 0.45 else valence * 0.7) * 0.2) + (loudness * 0.1))

    romantic = ("romantic", ((1 - energy) * 0.25 * ((1 - instrumentalness) if instrumentalness > 0.5 else 1.0)) + 
            (((valence * 1.5 if 0.35 <= valence <= 0.7 else valence * 0.3)) * 0.3) + ((acousticness * 0.5 + (1 - tempo) * 0.5) * 0.35) + ((1 - speechiness) * 0.1))

    mood_scores = [energetic, melancholic, calm, intense, happy, focused, party, romantic]
    sorted_mood_scores = sorted(mood_scores, key = lambda x: x[1], reverse = True)

    moods = ""

    for name, score in sorted_mood_scores[:3]: #we want at most the top 3
        if score >= .5: moods += (name + "-")
    
    if not moods: return "neutral"
    return moods[:-1]

def calculate_time(danceability, energy, loudness, acousticness, valence, tempo, mood):
    #normalize values to value between 0 and 1
    loudness = (loudness + 60) / 60 #between -60 and 0 db
    tempo = (tempo - 50) / 150 #between 50 and 200
    if tempo > 1: tempo = 1

    moods = mood.split("-")

    morning_energy_boost = 1.0 if 0.4 <= energy <= 0.75 else 0.5
    morning_valence_boost = 1.2 if valence > 0.5 else 0.8
    morning_mood_boost = 1.0
    if any(m in moods for m in ['happy', 'energetic', 'focused']): morning_mood_boost = 1.15
    if any(m in moods for m in ['sad', 'intense', 'melancholic']): morning_mood_boost = 0.7
    morning = ("morning", ((energy * morning_energy_boost * 0.30) + (valence * morning_valence_boost * 0.35) +
                            (tempo * 0.20) + ((1 - acousticness) * 0.10) + danceability * 0.05) * morning_mood_boost)
    
    afternoon_mood_boost = 1.0
    if any(m in moods for m in ['party', 'energetic', 'intense', 'happy']): afternoon_mood_boost = 1.1
    if any(m in moods for m in ['sad', 'calm', 'melancholic']): afternoon_mood_boost = 0.7
    afternoon = ("afternoon", ((energy * 0.35) + (danceability * 0.25) + (loudness * 0.15) + (tempo * 0.15) +
                                (valence * 0.10)) * afternoon_mood_boost)
    
    evening_energy_boost = 1.3 if energy < 0.5 else 0.8
    evening_acoustic_boost = 1.1 if acousticness > 0.5 else 1.0
    evening_mood_boost = 1.0
    if any(m in moods for m in ['calm', 'romantic', 'melancholic']): evening_mood_boost = 1.2
    if any(m in moods for m in ['intense', 'party']): evening_mood_boost = 0.7
    evening = ("evening", (((1 - energy) * evening_energy_boost * 0.35) + (acousticness * evening_acoustic_boost * 0.25) +
                            (valence * 0.20) + ((1 - tempo) * 0.10) + ((1 - loudness) * 0.10)) * evening_mood_boost)

    #determine if the song would be sleep or party oriented
    is_sleep = energy < 0.35
    is_party = energy > 0.85 and loudness > 0.7

    night_mood_boost = 1.0
    if any(m in moods for m in ['sad', 'melancholic', 'calm']) and is_sleep: night_mood_boost = 1.15
    if any(m in moods for m in ['party']) and is_party: night_mood_boost = 1.2

    sleep_score = (((1 - energy) * 2.0) + (acousticness * 0.3) + ((1 - loudness) * 0.2) + 
                    ((1 - tempo) * 0.1)) if is_sleep else 0
    party_score = ((energy * 1.5) + (loudness * 0.3) + (tempo * 0.2)) if is_party else 0

    night = ("night", (sleep_score + party_score) * night_mood_boost)

    time_scores = [morning, afternoon, evening, night]
    sorted_time_scores = sorted(time_scores, key = lambda x: x[1], reverse = True)

    times = ""

    for time, score in sorted_time_scores[:2]: #we want at most the top 2
        if score >= .5: times += (time + "-")

    if not times: return sorted_time_scores[0][0]

    return times[:-1]

if __name__ == "__main__":
    csv_data_analysis()