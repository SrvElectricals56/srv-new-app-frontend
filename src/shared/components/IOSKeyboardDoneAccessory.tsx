import { InputAccessoryView, Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import { LocalizedText as Text } from '@/shared/preferences/LocalizedNative';
import { usePreferenceContext } from '@/shared/preferences';

export const IOS_KEYBOARD_DONE_ACCESSORY_ID = 'srv-ios-keyboard-done';

export function IOSKeyboardDoneAccessory() {
  const { theme, tx } = usePreferenceContext();
  if (Platform.OS !== 'ios') return null;

  return (
    <InputAccessoryView nativeID={IOS_KEYBOARD_DONE_ACCESSORY_ID}>
      <View style={[styles.bar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tx('Done')}
          onPress={Keyboard.dismiss}
          style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}
        >
          <Text style={[styles.doneText, { color: theme.accent }]}>{tx('Done')}</Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 44,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  doneButton: {
    minWidth: 64,
    minHeight: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  doneText: { fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.6 },
});
