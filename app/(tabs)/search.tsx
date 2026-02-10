import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { SelectField } from '@/components/select-fields';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const MOOD_OPTIONS = [
  { label: 'Energetic', value: 'energetic' },
  { label: 'Melancholic', value: 'melancholic' },
  { label: 'Calm', value: 'calm' },
  { label: 'Intense', value: 'intense' },
  { label: 'Happy', value: 'happy' },
  { label: 'Focused', value: 'focused' },
  { label: 'Party', value: 'party' },
  { label: 'Romantic', value: 'romantic' },
]

const TIME_OPTIONS = [
  { label: 'Morning', value: 'morning' },
  { label: 'Afternoon', value: 'afternoon' },
  { label: 'Evening', value: 'evening' },
  { label: 'Night', value: 'night' },
]

export default function SearchScreen() {
  const [mood, setMood] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ThemedText type="title">Search</ThemedText>
        <SelectField
          label="Mood"
          placeholder="Select Mood"
          options={MOOD_OPTIONS.map((option) => option.label)}
          selected={mood}
          onChange={setMood}
        />
        <SelectField
          label="Time of Day"
          placeholder="Select Time"
          options={TIME_OPTIONS.map((option) => option.label)}
          selected={time}
          onChange={setTime}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 48
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    gap: 20,
  },
});
