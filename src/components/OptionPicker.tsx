import { Ionicons } from '@expo/vector-icons';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './ui';
import { colors, spacing } from './theme';

export interface Option<T> {
  value: T;
  label: string;
}

export function OptionPicker<T extends string | number>({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: Option<T>[];
  value: T | null | undefined;
  onSelect: (v: T) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={[styles.row, { justifyContent: 'space-between', padding: spacing.lg }]}>
          <Text style={styles.h2}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
        </View>
        <FlatList
          data={options}
          keyExtractor={(o) => String(o.value)}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onSelect(item.value);
                onClose();
              }}
              style={[styles.listRow, { justifyContent: 'space-between' }]}
            >
              <Text style={styles.rowTitle}>{item.label}</Text>
              {item.value === value && <Ionicons name="checkmark" size={22} color={colors.primary} />}
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}
