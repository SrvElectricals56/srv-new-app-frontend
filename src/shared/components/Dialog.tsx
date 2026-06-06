import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';

type DialogVariant = 'confirm' | 'destructive' | 'success' | 'error' | 'info';

export interface Choice {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  icon?: string;
}

const CameraIcon = ({ color = '#475569' }: { color?: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <Circle cx="12" cy="13" r="4" />
  </Svg>
);

const ImageIcon = ({ color = '#475569' }: { color?: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <Circle cx="8.5" cy="8.5" r="1.5" />
    <Path d="m21 15-5-5L5 21" />
  </Svg>
);

const FileIcon = ({ color = '#475569' }: { color?: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <Polyline points="14 2 14 8 20 8" />
    <Line x1="16" y1="13" x2="8" y2="13" />
    <Line x1="16" y1="17" x2="8" y2="17" />
  </Svg>
);

const CHOICE_ICONS: Record<string, (color?: string) => JSX.Element> = {
  camera: (c) => <CameraIcon color={c} />,
  image: (c) => <ImageIcon color={c} />,
  file: (c) => <FileIcon color={c} />,
};

interface DialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  variant?: DialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  icon?: string;
  choices?: Choice[];
  cancelButton?: boolean;
}

const VARIANT_META: Record<DialogVariant, { icon: string; accent: string }> = {
  confirm: { icon: '📋', accent: '#6366F1' },
  destructive: { icon: '⚠️', accent: '#EF4444' },
  success: { icon: '✅', accent: '#10B981' },
  error: { icon: '❌', accent: '#EF4444' },
  info: { icon: 'ℹ️', accent: '#3B82F6' },
};

export function Dialog({
  visible,
  onClose,
  title,
  message,
  variant = 'confirm',
  confirmLabel,
  cancelLabel,
  onConfirm,
  icon,
  choices,
  cancelButton,
}: DialogProps) {
  const { theme } = usePreferenceContext();
  const meta = VARIANT_META[variant];
  const displayIcon = icon ?? meta.icon;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 18,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scaleAnim]);

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  const hasTwoButtons = variant === 'confirm' || variant === 'destructive';

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={choices ? () => {} : onClose}>
        <Animated.View style={[styles.card, { backgroundColor: theme.surface, transform: [{ scale: scaleAnim }] }]}>
          <Pressable onPress={() => {}}>
            <View style={[styles.iconWrap, { backgroundColor: meta.accent + '14' }]}>
              <Text style={styles.icon}>{displayIcon}</Text>
            </View>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
            {message ? (
              <Text style={[styles.message, { color: theme.textMuted }]}>{message}</Text>
            ) : null}
            <View style={choices ? styles.choicesContainer : styles.actions}>
              {choices ? (
                <>
                  <View style={styles.choicesGrid}>
                    {choices.map((c, i) => {
                      const renderIcon = c.icon ? CHOICE_ICONS[c.icon] : null;
                      const isFull = choices.length % 2 !== 0 && i === choices.length - 1;
                      return (
                        <Pressable
                          key={i}
                          style={[styles.choiceBtn, isFull && styles.choiceBtnFull, { backgroundColor: theme.surface, borderColor: theme.border }]}
                          onPress={() => { c.onPress(); onClose(); }}
                        >
                          {renderIcon ? renderIcon(c.destructive ? '#DC2626' : '#475569') : null}
                          <Text style={[styles.choiceBtnText, { color: c.destructive ? '#DC2626' : theme.textPrimary }]}>{c.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {cancelButton !== false && (
                    <Pressable style={styles.cancelBtn} onPress={onClose}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </Pressable>
                  )}
                </>
              ) : hasTwoButtons ? (
                <>
                  <Pressable
                    style={[styles.btn, styles.btnCancel, { backgroundColor: theme.soft, borderColor: theme.border }]}
                    onPress={onClose}
                  >
                    <Text style={[styles.btnText, { color: theme.textPrimary }]}>{cancelLabel ?? 'Cancel'}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.btn, { backgroundColor: meta.accent }]}
                    onPress={handleConfirm}
                  >
                    <Text style={[styles.btnText, styles.btnPrimaryText]}>{confirmLabel ?? (variant === 'destructive' ? 'Delete' : 'Confirm')}</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable style={[styles.btn, { backgroundColor: meta.accent }]} onPress={() => { onConfirm?.(); onClose(); }}>
                  <Text style={[styles.btnText, styles.btnPrimaryText]}>OK</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    ...createShadow({ color: '#000', offsetY: 16, blur: 48, opacity: 0.3, elevation: 20 }),
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  icon: { fontSize: 32 },
  title: {
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 26,
    paddingHorizontal: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 26,
    paddingHorizontal: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  choicesContainer: {
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  choicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  choiceBtn: {
    width: '48%',
    flexGrow: 1,
    height: 82,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  choiceBtnFull: {
    width: '100%',
    height: 82,
    flexDirection: 'row',
    gap: 10,
  },
  choiceBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cancelBtn: {
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  btnCancel: {
    borderWidth: 1,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
