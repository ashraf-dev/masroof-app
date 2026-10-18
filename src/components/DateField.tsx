import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { addDays, parseISODate, toISODate, today } from '@/lib/dates';
import { formatDate } from '@/lib/format';
import { useT } from '@/i18n';
import { Chip, styles } from './ui';

/** Quick chips for today / yesterday plus a full picker. */
export function DateField({ value, onChange, allowFuture }: { value: string; onChange: (v: string) => void; allowFuture?: boolean }) {
  const { t, lang } = useT();
  const [open, setOpen] = useState(false);
  const isToday = value === today();
  const isYesterday = value === addDays(today(), -1);
  return (
    <View style={{ gap: 8 }}>
      <View style={[styles.row, { flexWrap: 'wrap' }]}>
        <Chip label={t('common.today')} selected={isToday} onPress={() => onChange(today())} />
        <Chip label={t('common.yesterday')} selected={isYesterday} onPress={() => onChange(addDays(today(), -1))} />
        <Chip label={!isToday && !isYesterday ? formatDate(value, lang) : t('common.pickDate')} selected={!isToday && !isYesterday} onPress={() => setOpen((o) => !o)} />
      </View>
      {open && (
        <DateTimePicker
          value={parseISODate(value)}
          mode="date"
          maximumDate={allowFuture ? undefined : new Date()}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(event, date) => {
            if (Platform.OS !== 'ios') setOpen(false);
            if (event.type === 'set' && date) onChange(toISODate(date));
          }}
        />
      )}
    </View>
  );
}
