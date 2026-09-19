import { LocalizedText as Text } from '@/shared/preferences/LocalizedNative';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { withWebSafeNativeDriver } from '@/shared/animations/nativeDriver';
import { createShadow } from '@/shared/theme/shadows';

export type TestimonialItem = {
  initials: string;
  name: string;
  location: string;
  tier: string;
  yearsWithUs: string;
  quote: string;
  highlight: string;
  colors: readonly [string, string, string];
  ring: string;
  glow: string;
  profileImage?: string | null;
};

const TESTIMONIAL_THEME_PRESETS = [
  {
    colors: ['#EEF2FF', '#D9D6FE', '#C4B5FD'] as const,
    ring: '#7C3AED',
    glow: '#DDD6FE',
  },
  {
    colors: ['#ECFEFF', '#CFFAFE', '#A5F3FC'] as const,
    ring: '#0F766E',
    glow: '#CCFBF1',
  },
  {
    colors: ['#F7FEE7', '#DCFCE7', '#BEF264'] as const,
    ring: '#65A30D',
    glow: '#ECFCCB',
  },
  {
    colors: ['#FFF7E6', '#FDE6B4', '#F6C96E'] as const,
    ring: '#D97706',
    glow: '#FFE7BA',
  },
  {
    colors: ['#FFF1EC', '#FFD8CC', '#F6B9A4'] as const,
    ring: '#C2410C',
    glow: '#FFD8CC',
  },
] as const;

export function getTestimonialTheme(index: number) {
  return TESTIMONIAL_THEME_PRESETS[index % TESTIMONIAL_THEME_PRESETS.length];
}

export const TESTIMONIAL_FALLBACK_COPY = [
  {
    initials: 'GS',
    name: 'Gurpreet Singh',
    location: 'Amritsar',
    tier: 'Diamond',
    yearsWithUs: 'Connected for 4 years',
    quote:
      'Whether it is a big installation or a quick site visit, SRV feels dependable both in product quality and app flow.',
    highlight: 'Reliable performance on real job sites',
  },
  {
    initials: 'AV',
    name: 'Amit Verma',
    location: 'Panchkula',
    tier: 'Platinum',
    yearsWithUs: 'Connected for 3 years',
    quote:
      'Points get added fast after scanning, and reward tracking is much cleaner than before.',
    highlight: 'Fast scan flow with clear rewards',
  },
  {
    initials: 'HK',
    name: 'Harpal Kaur',
    location: 'Jalandhar',
    tier: 'Platinum',
    yearsWithUs: 'Connected for 2 years',
    quote:
      'Dealer support feels available whenever needed, and the whole experience stays smooth while working in the field.',
    highlight: 'Built for day-to-day field work',
  },
  {
    initials: 'RS',
    name: 'Ravi Sharma',
    location: 'Mohali',
    tier: 'Gold',
    yearsWithUs: 'Connected for 3 years',
    quote:
      'Transparent rewards, simple redemption, and timely support make the app practical for regular use.',
    highlight: 'Transparent rewards and timely payments',
  },
  {
    initials: 'NK',
    name: 'Naveen Kumar',
    location: 'Ludhiana',
    tier: 'Silver',
    yearsWithUs: 'Connected for 1 year',
    quote:
      'The learning curve feels easy, and the app makes it simple to stay active from the very beginning.',
    highlight: 'Good start and easy learning curve',
  },
] as const;

function StarRow({ color }: { color: string }) {
  return <Text style={[styles.stars, { color }]}>*****</Text>;
}

function TestimonialCard({
  item,
  index,
  active,
  darkMode,
  onPress,
}: {
  item: TestimonialItem;
  index: number;
  active: boolean;
  darkMode: boolean;
  onPress: () => void;
}) {
  const pressScale = useRef(new Animated.Value(active ? 1.02 : 1)).current;
  const ringPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(
      pressScale,
      withWebSafeNativeDriver({
        toValue: active ? 1.02 : 1,
        tension: 110,
        friction: 8,
      })
    ).start();
  }, [active, pressScale]);

  useEffect(() => {
    const delay = index * 200;
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(
          ringPulse,
          withWebSafeNativeDriver({
            toValue: 1,
            duration: 1800,
            delay,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        Animated.timing(
          ringPulse,
          withWebSafeNativeDriver({
            toValue: 0,
            duration: 1800,
            delay: 0,
            easing: Easing.inOut(Easing.ease),
          })
        ),
      ])
    );

    pulseLoop.start();
    return () => {
      pulseLoop.stop();
    };
  }, [index, ringPulse]);

  const handlePressIn = () => {
    Animated.spring(
      pressScale,
      withWebSafeNativeDriver({
        toValue: active ? 0.995 : 0.97,
        tension: 120,
        friction: 8,
      })
    ).start();
  };

  const handlePressOut = () => {
    Animated.spring(
      pressScale,
      withWebSafeNativeDriver({
        toValue: active ? 1.02 : 1,
        tension: 120,
        friction: 8,
      })
    ).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.card,
          darkMode ? styles.cardDark : null,
          active ? styles.cardActive : null,
          darkMode && active ? styles.cardActiveDark : null,
          { transform: [{ scale: pressScale }] },
        ]}
      >
        <LinearGradient
          colors={item.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardTop}
        >
          <Animated.View
            style={[
              styles.avatarOuter,
              {
                borderColor: item.ring,
                transform: [
                  {
                    scale: ringPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.08],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[styles.avatarInner, { backgroundColor: item.glow }]}>
              {item.profileImage ? (
                <Image
                  source={{ uri: item.profileImage }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={[styles.initials, { color: item.ring }]}>{item.initials}</Text>
              )}
            </View>
          </Animated.View>
        </LinearGradient>

        <View style={styles.cardBody}>
          <StarRow color={darkMode ? '#FBBF24' : '#D97706'} />
          <Text style={[styles.name, darkMode ? styles.nameDark : null]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.meta, darkMode ? styles.metaDark : null]} numberOfLines={1}>
            {item.location} | {item.tier}
          </Text>
          <Text style={[styles.quote, darkMode ? styles.quoteDark : null]} numberOfLines={2}>
            &ldquo;{item.quote}&rdquo;
          </Text>
          <View style={[styles.highlightChip, darkMode ? styles.highlightChipDark : null]}>
            <Text
              style={[styles.highlightText, darkMode ? styles.highlightTextDark : null]}
              numberOfLines={1}
            >
              {item.highlight}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

function CloseIcon({ color = '#0F172A' }: { color?: string }) {
  return <Text style={{ color, fontSize: 18, fontWeight: '900', lineHeight: 18 }}>x</Text>;
}

function DetailCard({
  item,
  darkMode,
  onClose,
}: {
  item: TestimonialItem;
  darkMode: boolean;
  onClose: () => void;
}) {
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    reveal.setValue(0);
    Animated.timing(
      reveal,
      withWebSafeNativeDriver({
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
      })
    ).start();
  }, [item, reveal]);

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <Animated.View
          style={[
            styles.detailCard,
            darkMode ? styles.detailCardDark : null,
            {
              opacity: reveal,
              transform: [
                {
                  scale: reveal.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.92, 1],
                  }),
                },
                {
                  translateY: reveal.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable
            style={[styles.closeBtn, darkMode ? styles.closeBtnDark : null]}
            onPress={onClose}
          >
            <CloseIcon color={darkMode ? '#E2E8F0' : '#0F172A'} />
          </Pressable>

          <View style={styles.detailHeader}>
            <LinearGradient
              colors={item.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.detailAvatarFrame}
            >
              <View style={[styles.detailAvatarOuter, { borderColor: item.ring }]}>
                <View style={[styles.detailAvatarInner, { backgroundColor: item.glow }]}>
                  {item.profileImage ? (
                    <Image
                      source={{ uri: item.profileImage }}
                      style={styles.detailAvatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={[styles.detailInitials, { color: item.ring }]}>{item.initials}</Text>
                  )}
                </View>
              </View>
            </LinearGradient>

            <View style={styles.detailInfo}>
              <Text style={[styles.detailName, darkMode ? styles.detailNameDark : null]}>
                {item.name}
              </Text>
              <Text style={[styles.detailMeta, darkMode ? styles.detailMetaDark : null]}>
                {item.location}
              </Text>
              <View style={styles.detailChipRow}>
                <View style={[styles.detailChip, darkMode ? styles.detailChipDark : null]}>
                  <Text
                    style={[styles.detailChipText, darkMode ? styles.detailChipTextDark : null]}
                  >
                    {item.tier}
                  </Text>
                </View>
                <View style={[styles.detailChip, darkMode ? styles.detailChipDark : null]}>
                  <Text
                    style={[styles.detailChipText, darkMode ? styles.detailChipTextDark : null]}
                  >
                    {item.yearsWithUs}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={[styles.detailQuote, darkMode ? styles.detailQuoteDark : null]}>
            &ldquo;{item.quote}&rdquo;
          </Text>

          <View style={[styles.detailHighlight, darkMode ? styles.detailHighlightDark : null]}>
            <Text
              style={[styles.detailHighlightText, darkMode ? styles.detailHighlightTextDark : null]}
            >
              {item.highlight}
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function TestimonialShowcase({
  eyebrow,
  title,
  subtitle,
  items,
  darkMode,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: TestimonialItem[];
  darkMode: boolean;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const openedItem = openIndex === null ? null : (items[openIndex] ?? null);

  return (
    <View style={[styles.section, darkMode ? styles.sectionDark : null]}>
      <LinearGradient
        colors={darkMode ? ['#0F172A', '#14213A', '#1B2B45'] : ['#FFFFFF', '#F7FBFF', '#EEF6FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.shell}
      >
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text style={[styles.eyebrow, darkMode ? styles.eyebrowDark : null]}>{eyebrow}</Text>
            <Text style={[styles.title, darkMode ? styles.titleDark : null]}>{title}</Text>
            <Text style={[styles.subtitle, darkMode ? styles.subtitleDark : null]}>{subtitle}</Text>
          </View>
          <View style={[styles.badge, darkMode ? styles.badgeDark : null]}>
            <Text style={[styles.badgeText, darkMode ? styles.badgeTextDark : null]}>4.9/5</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          decelerationRate="fast"
          snapToAlignment="start"
        >
          {items.map((item, index) => (
            <TestimonialCard
              key={`${item.name}-${index}`}
              item={item}
              index={index}
              darkMode={darkMode}
              active={selectedIndex === index}
              onPress={() => {
                setSelectedIndex(index);
                setOpenIndex(index);
              }}
            />
          ))}
        </ScrollView>
      </LinearGradient>
      {openedItem ? (
        <DetailCard item={openedItem} darkMode={darkMode} onClose={() => setOpenIndex(null)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 22,
    borderRadius: 28,
    ...createShadow({ color: '#0F172A', offsetY: 10, blur: 22, opacity: 0.08, elevation: 5 }),
  },
  sectionDark: {
    ...createShadow({ color: '#020617', offsetY: 10, blur: 22, opacity: 0.22, elevation: 5 }),
  },
  shell: {
    borderRadius: 28,
    paddingTop: 20,
    paddingBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(214,227,244,0.9)',
    overflow: 'hidden',
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  headingCopy: {
    flex: 1,
  },
  eyebrow: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 5,
  },
  eyebrowDark: { color: '#94A3B8' },
  title: {
    color: '#14213D',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  titleDark: { color: '#F8FAFC' },
  subtitle: {
    color: '#6B7A90',
    fontSize: 12.5,
    lineHeight: 18,
    maxWidth: '92%',
  },
  subtitleDark: { color: '#CBD5E1' },
  badge: {
    minWidth: 68,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgeDark: {
    backgroundColor: 'rgba(37,99,235,0.16)',
    borderColor: 'rgba(96,165,250,0.26)',
  },
  badgeText: { color: '#1D4ED8', fontSize: 13, fontWeight: '900' },
  badgeTextDark: { color: '#BFDBFE' },
  row: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 12,
  },
  card: {
    width: 176,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...createShadow({ color: '#0F172A', offsetY: 8, blur: 14, opacity: 0.06, elevation: 4 }),
  },
  cardDark: {
    backgroundColor: '#111827',
    borderColor: '#243043',
    ...createShadow({ color: '#020617', offsetY: 8, blur: 14, opacity: 0.06, elevation: 4 }),
  },
  cardActive: {
    borderColor: '#93C5FD',
    ...createShadow({ color: '#0F172A', offsetY: 8, blur: 14, opacity: 0.14, elevation: 7 }),
  },
  cardActiveDark: {
    borderColor: '#3B82F6',
  },
  cardTop: {
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  avatarOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  avatarInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 24,
    fontWeight: '900',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  stars: {
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  name: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '900',
  },
  nameDark: { color: '#F8FAFC' },
  meta: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  metaDark: { color: '#94A3B8' },
  quote: {
    color: '#475569',
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 8,
    minHeight: 36,
    fontStyle: 'italic',
  },
  quoteDark: { color: '#CBD5E1' },
  highlightChip: {
    marginTop: 10,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
  },
  highlightChipDark: {
    backgroundColor: '#0F172A',
  },
  highlightText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '800',
  },
  highlightTextDark: { color: '#E2E8F0' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.46)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  detailCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    padding: 16,
    width: '100%',
    maxWidth: 420,
  },
  detailCardDark: {
    backgroundColor: '#0F172A',
    borderColor: '#243B53',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 5,
  },
  closeBtnDark: {
    backgroundColor: '#111827',
    borderColor: '#334155',
  },
  detailHeader: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    paddingRight: 42,
  },
  detailAvatarFrame: {
    width: 86,
    height: 86,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailAvatarOuter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  detailAvatarInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailInitials: {
    fontSize: 22,
    fontWeight: '900',
  },
  detailAvatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  detailInfo: {
    flex: 1,
  },
  detailName: {
    color: '#14213D',
    fontSize: 17,
    fontWeight: '900',
  },
  detailNameDark: { color: '#F8FAFC' },
  detailMeta: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
  },
  detailMetaDark: { color: '#94A3B8' },
  detailChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  detailChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  detailChipDark: {
    backgroundColor: '#111827',
    borderColor: '#334155',
  },
  detailChipText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '800',
  },
  detailChipTextDark: { color: '#BFDBFE' },
  detailQuote: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 14,
    fontStyle: 'italic',
  },
  detailQuoteDark: { color: '#E2E8F0' },
  detailHighlight: {
    marginTop: 14,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
  },
  detailHighlightDark: {
    backgroundColor: '#111827',
  },
  detailHighlightText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
  },
  detailHighlightTextDark: { color: '#E2E8F0' },
  rail: {
    height: 3,
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
    marginTop: 14,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  railFill: {
    minWidth: '26%',
    height: '100%',
    borderRadius: 999,
  },
});
