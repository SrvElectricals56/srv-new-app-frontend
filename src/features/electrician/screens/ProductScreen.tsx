import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';

type ProductTheme = 'electrician' | 'dealer';

const THEMES = {
  electrician: {
    primary: '#2563EB',
    primaryLight: '#DBEAFE',
    premiumTag: '#2563EB',
    premiumTagBg: '#DBEAFE',
    screenBg: '#EEF4FF',
    searchBg: '#F8FBFF',
    sectionBg: '#E0ECFF',
    imageBg: '#F4F8FF',
    cardBorder: '#C7DBFF',
  },
  dealer: {
    primary: '#A16207',
    primaryLight: '#FEF3C7',
    premiumTag: '#A16207',
    premiumTagBg: '#FEF3C7',
    screenBg: '#FFF8EC',
    searchBg: '#FFFDF7',
    sectionBg: '#FCE7B2',
    imageBg: '#FFF8E8',
    cardBorder: '#F2D28A',
  },
} as const;

function SearchIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={2} />
      <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

const CATEGORIES = [
  { id: 'all', name: 'All Products', emoji: '⚡' },
  { id: 'boxes', name: 'MCB & DB\nBoxes', emoji: '🔌' },
  { id: 'conduit', name: 'Conduit\nPipes', emoji: '🔧' },
  { id: 'changeover', name: 'Change\nOver', emoji: '🔄' },
  { id: 'fans', name: 'Fans &\nVentilation', emoji: '💨' },
  { id: 'stabilizer', name: 'Voltage\nStabilizer', emoji: '⚙️' },
  { id: 'modular', name: 'Modular\nBoxes', emoji: '📦' },
  { id: 'junction', name: 'Junction\nBoxes', emoji: '🗄' },
  { id: 'concealed', name: 'Concealed\nBoxes', emoji: '🏠' },
];

const BASE_PRODUCTS = [
  { id: '1', name: 'MCB Distribution Box', category: 'boxes', image: require('../../../../assets/Product/MCB Distribuation Box.png'), tag: 'ISI Certified', tagColor: '#059669', tagBg: '#D1FAE5', desc: 'For residential & commercial use' },
  { id: '2', name: 'Voltage Stabilizer', category: 'stabilizer', image: require('../../../../assets/Product/Voltage Stabilizer.png'), tag: 'Best Seller', tagColor: '#D97706', tagBg: '#FEF3C7', desc: 'Automatic voltage protection' },
  { id: '3', name: 'PVC Conduit Pipe', category: 'conduit', image: require('../../../../assets/Product/PVC Conduit Pipe.png'), tag: 'ISI Certified', tagColor: '#059669', tagBg: '#D1FAE5', desc: 'Rigid PVC wiring protection' },
  { id: '4', name: 'Automatic Change Over', category: 'changeover', image: require('../../../../assets/Product/AUTOMATIC CHANGE OVER.png'), tag: 'Premium', tagColor: '#2563EB', tagBg: '#DBEAFE', desc: 'Seamless power switching' },
  { id: '5', name: 'Fan Box 4" Range', category: 'fans', image: require('../../../../assets/Product/Fan box.png'), tag: 'Popular', tagColor: '#0891B2', tagBg: '#CFFAFE', desc: 'Ceiling fan installation box' },
  { id: '6', name: 'Concealed Box', category: 'concealed', image: require('../../../../assets/Product/Concelead Box.png'), tag: 'ISI Certified', tagColor: '#059669', tagBg: '#D1FAE5', desc: 'For modular switch fitting' },
  { id: '7', name: 'Modular Box', category: 'modular', image: require('../../../../assets/Product/Modular_Box.png'), tag: 'New', tagColor: '#DC2626', tagBg: '#FEE2E2', desc: 'Modern switch installations' },
  { id: '8', name: 'Junction Box', category: 'junction', image: require('../../../../assets/Product/Junction_Box.png'), tag: 'ISI Certified', tagColor: '#059669', tagBg: '#D1FAE5', desc: 'Weatherproof wire connections' },
];

export function ProductScreen({
  onNavigate,
  theme = 'electrician',
}: {
  onNavigate: (screen: any) => void;
  theme?: ProductTheme;
}) {
  const { darkMode, tx } = usePreferenceContext();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const palette = THEMES[theme];

  const SIDEBAR_W = 90;
  const cardWidth = (width - SIDEBAR_W - 28) / 2;
  const products = BASE_PRODUCTS.map((product) =>
    product.id === '4'
      ? { ...product, tagColor: palette.premiumTag, tagBg: palette.premiumTagBg }
      : product
  );

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const bg = darkMode ? '#0F172A' : palette.screenBg;
  const sidebarBg = darkMode ? '#1E293B' : '#FFFFFF';
  const cardBg = darkMode ? '#1E293B' : '#FFFFFF';
  const borderColor = darkMode ? '#2D3748' : palette.cardBorder;
  const textPrimary = darkMode ? '#F1F5F9' : '#1A1A1A';
  const textMuted = darkMode ? '#94A3B8' : '#777777';
  const activeCat = CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: palette.primary,
            ...createShadow({ color: palette.primary, offsetY: 3, blur: 10, opacity: 0.3, elevation: 6 }),
          },
        ]}
      >
        <Text style={styles.headerTitle}>{tx('All Categories')}</Text>
        <View style={[styles.searchRow, darkMode ? null : { backgroundColor: palette.searchBg, borderColor: palette.cardBorder }]}>
          <SearchIcon size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder={tx('Search SRV products...')}
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.body}>
        <View style={[styles.sidebar, { width: SIDEBAR_W, backgroundColor: sidebarBg, borderRightColor: borderColor }]}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  android_ripple={{ color: `${palette.primary}15` }}
                  style={[
                    styles.sidebarItem,
                    { borderBottomColor: borderColor },
                    isActive && { backgroundColor: darkMode ? `${palette.primary}30` : `${palette.primary}12` },
                  ]}
                >
                  {isActive && <View style={[styles.activeBar, { backgroundColor: palette.primary }]} />}
                  <Text style={styles.sidebarEmoji}>{cat.emoji}</Text>
                  <Text
                    style={[styles.sidebarLabel, { color: isActive ? palette.primary : textMuted }, isActive && { fontWeight: '800' }]}
                    numberOfLines={3}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView style={styles.productsArea} showsVerticalScrollIndicator={false} contentContainerStyle={styles.productsContent}>
          <View style={[styles.sectionHead, { borderBottomColor: borderColor, backgroundColor: darkMode ? '#162033' : palette.sectionBg }]}>
            <Text style={styles.sectionEmoji}>{activeCat?.emoji}</Text>
            <View>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>{activeCat?.name?.replace('\n', ' ')}</Text>
              <Text style={[styles.sectionCount, { color: textMuted }]}>{filteredProducts.length} {tx('products')}</Text>
            </View>
          </View>

          {filteredProducts.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={[styles.emptyText, { color: textMuted }]}>{tx('No products found')}</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {filteredProducts.map((product) => (
                <View key={product.id} style={[styles.card, { width: cardWidth, backgroundColor: cardBg, borderColor }]}>
                  <View style={[styles.tag, { backgroundColor: product.tagBg }]}>
                    <Text style={[styles.tagText, { color: product.tagColor }]}>{product.tag}</Text>
                  </View>
                  <View style={[styles.imgWrap, darkMode ? null : { backgroundColor: palette.imageBg }]}>
                    <Image source={product.image} style={styles.img} resizeMode="contain" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardName, { color: textPrimary }]} numberOfLines={2}>{product.name}</Text>
                    <Text style={[styles.cardDesc, { color: textMuted }]} numberOfLines={1}>{product.desc}</Text>
                  </View>
                  <Pressable style={[styles.buyBtn, { backgroundColor: palette.primaryLight }]} android_ripple={{ color: `${palette.primary}25` }}>
                    <Text style={[styles.buyBtnText, { color: palette.primary }]}>{tx('Buy Now')}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          <View style={{ height: 110 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 14, paddingBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', marginBottom: 8 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, gap: 8, borderWidth: 1, borderColor: 'transparent' },
  searchInput: { flex: 1, fontSize: 13, color: '#1E293B', padding: 0 },
  body: { flex: 1, flexDirection: 'row' },
  sidebar: { borderRightWidth: 1 },
  sidebarItem: { paddingVertical: 14, paddingHorizontal: 6, alignItems: 'center', borderBottomWidth: 1, position: 'relative', minHeight: 72, justifyContent: 'center' },
  activeBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  sidebarEmoji: { fontSize: 24, marginBottom: 5 },
  sidebarLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center', lineHeight: 13 },
  productsArea: { flex: 1 },
  productsContent: { padding: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, paddingHorizontal: 10, paddingTop: 10, borderRadius: 14 },
  sectionEmoji: { fontSize: 28 },
  sectionTitle: { fontSize: 14, fontWeight: '900' },
  sectionCount: { fontSize: 11, marginTop: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', ...createShadow({ color: '#000', offsetY: 1, blur: 6, opacity: 0.07, elevation: 2 }) },
  tag: { alignSelf: 'flex-start', margin: 7, marginBottom: 0, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  tagText: { fontSize: 9, fontWeight: '800' },
  imgWrap: { height: 100, alignItems: 'center', justifyContent: 'center', padding: 8, marginHorizontal: 8, borderRadius: 12 },
  img: { width: '100%', height: '100%' },
  cardInfo: { paddingHorizontal: 8, paddingBottom: 6 },
  cardName: { fontSize: 12, fontWeight: '700', lineHeight: 16, marginBottom: 2 },
  cardDesc: { fontSize: 10, lineHeight: 14 },
  buyBtn: { marginHorizontal: 8, marginBottom: 10, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  buyBtnText: { fontSize: 11, fontWeight: '800' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, fontWeight: '600' },
});
