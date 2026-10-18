import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { colors } from './theme';

export function AddExpenseFab() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="add expense"
      onPress={() => router.push({ pathname: '/expense/[id]', params: { id: 'new' } })}
      style={({ pressed }) => ({
        position: 'absolute',
        bottom: 20,
        end: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      })}
    >
      <Ionicons name="add" size={32} color="#fff" />
    </Pressable>
  );
}
