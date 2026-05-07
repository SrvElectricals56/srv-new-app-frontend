import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import type { Screen } from '@/shared/types/navigation';

function PlayIcon({ size = 28, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 6.5v11l9-5.5-9-5.5z"
        fill={color}
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReelsIcon({ size = 22, color = '#658E37' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="4" stroke={color} strokeWidth={1.8} />
      <Path d="M9 3l3 4M14 3l3 4M4 8h16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M10 11v4.5l4-2.25-4-2.25z" fill={color} />
    </Svg>
  );
}

function VideosIcon({ size = 22, color = '#658E37' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="5.5" width="13" height="13" rx="3" stroke={color} strokeWidth={1.8} />
      <Path d="M16.5 10l4-2v8l-4-2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 10.2v3.6l3-1.8-3-1.8z" fill={color} />
    </Svg>
  );
}

function TipsIcon({ size = 22, color = '#658E37' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="9" r="5" stroke={color} strokeWidth={1.8} />
      <Path d="M10 16h4M9 19h6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M12 7v2.4M12 12.5h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

const PREVIEW_CARDS = [
  {
    id: 'reels',
    title: 'Quick Reels',
    subtitle: 'Fast product tips and smart usage ideas',
    icon: ReelsIcon,
  },
  {
    id: 'videos',
    title: 'Video Guides',
    subtitle: 'Step-by-step explainers for customers',
    icon: VideosIcon,
  },
  {
    id: 'tips',
    title: 'Helpful Shorts',
    subtitle: 'Easy buying help and product highlights',
    icon: TipsIcon,
  },
];

export function PlayScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const { darkMode, tx } = usePreferenceContext();
  const insets = useSafeAreaInsets();

  const bg = darkMode ? '#101826' : '#F4F8EE';
  const cardBg = darkMode ? '#162235' : '#FFFFFF';
  const textPrimary = darkMode ? '#F8FAFC' : '#1D2A1A';
  const textMuted = darkMode ? '#A9B6C6' : '#74816B';
  const outline = darkMode ? '#26364B' : '#DDE7D1';

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: bg }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={darkMode ? ['#1B2B17', '#18251E', '#111827'] : ['#7BA53D', '#91BA55', '#DDEDC1']} style={styles.hero}>
        <View style={styles.heroBadge}>
          <PlayIcon size={18} />
          <Text style={styles.heroBadgeText}>{tx('Play')}</Text>
        </View>
        <Text style={styles.heroTitle}>{tx('Learning videos are coming soon')}</Text>
        <Text style={styles.heroSubtitle}>
          {tx('We will add reels, product demos and helpful customer videos here.')}
        </Text>
        <Pressable onPress={() => onNavigate('categories')} style={styles.heroButton}>
          <Text style={styles.heroButtonText}>{tx('Browse Categories')}</Text>
        </Pressable>
      </LinearGradient>

      <View style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>{tx('What will be here')}</Text>
        <Text style={[styles.sectionSubtitle, { color: textMuted }]}>
          {tx('A clean space for future reels and videos')}
        </Text>
      </View>

      {PREVIEW_CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <View key={card.id} style={[styles.previewCard, { backgroundColor: cardBg, borderColor: outline }]}>
            <View style={styles.previewIconWrap}>
              <Icon />
            </View>
            <View style={styles.previewTextWrap}>
              <Text style={[styles.previewTitle, { color: textPrimary }]}>{tx(card.title)}</Text>
              <Text style={[styles.previewSubtitle, { color: textMuted }]}>{tx(card.subtitle)}</Text>
            </View>
          </View>
        );
      })}

      <View style={[styles.noteCard, { backgroundColor: cardBg, borderColor: outline }]}>
        <Text style={[styles.noteTitle, { color: textPrimary }]}>{tx('Ready for future content')}</Text>
        <Text style={[styles.noteText, { color: textMuted }]}>
          {tx('This page is prepared for customer-facing educational content. We can add reels and videos here next.')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 110, gap: 16 },
  hero: {
    borderRadius: 28,
    padding: 22,
    ...createShadow({ color: '#6B7C2D', offsetY: 10, blur: 20, opacity: 0.2, elevation: 8 }),
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 16,
  },
  heroBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  heroTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', lineHeight: 34, maxWidth: 280 },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    maxWidth: 300,
  },
  heroButton: {
    alignSelf: 'flex-start',
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
  },
  heroButtonText: { color: '#5D7830', fontSize: 13, fontWeight: '800' },
  sectionHead: { marginTop: 6 },
  sectionTitle: { fontSize: 20, fontWeight: '900' },
  sectionSubtitle: { marginTop: 4, fontSize: 13, lineHeight: 19 },
  previewCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  previewIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF5E2',
  },
  previewTextWrap: { flex: 1 },
  previewTitle: { fontSize: 16, fontWeight: '800' },
  previewSubtitle: { marginTop: 4, fontSize: 13, lineHeight: 19 },
  noteCard: {
    marginTop: 6,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  noteTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  noteText: { fontSize: 13, lineHeight: 20 },
});
