import { Text, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { BikeFormState, InputStyling } from '../types';
import { styles } from '../styles';

interface NotesSectionProps {
  readonly state: BikeFormState;
  readonly inputStyling: InputStyling;
}

export function NotesSection({ state, inputStyling }: NotesSectionProps) {
  const { t } = useTranslation('bikes');

  return (
    <>
      <Text variant="labelLarge" style={styles.label}>
        {t('form.notesLabel')}
      </Text>
      <TextInput
        mode="flat"
        value={state.notes}
        onChangeText={state.setNotes}
        placeholder={t('form.notesPlaceholder')}
        multiline
        numberOfLines={4}
        style={[inputStyling.softInputStyle, styles.notesInput]}
        underlineColor={inputStyling.underlineColor}
        activeUnderlineColor={inputStyling.activeUnderlineColor}
      />
    </>
  );
}
