/**
 * BannerCarousel
 *
 * Slides use native horizontal paging so the banner follows the user's finger.
 * Auto-play resumes after a manual swipe and the indicator stays synchronized.
 *
 * Each image is rendered with resizeMode="cover" so it fills the
 * container edge-to-edge with no black bars. The container height
 * is driven by `aspectRatio` (default 3/2 to match the 600×400
 * banner assets). Pass a custom aspectRatio for wider/taller images.
 *
 * The legacy `height` prop is still accepted for backward-compat
 * but is ignored when `aspectRatio` is provided.
 */

import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

export type BannerSlide = {
  image: { uri: string } | number;
  resizeMode?: 'cover' | 'contain' | 'stretch';
  backgroundColor?: string;
};

type Props = {
  slides: BannerSlide[];
  height: number;
  darkMode?: boolean;
  autoPlayInterval?: number;
  borderRadius?: number;
};

export function BannerCarousel({
  slides,
  height,
  darkMode = false,
  autoPlayInterval = 4000,
  borderRadius = 16,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);

  const activeRef = useRef(0);
  const lenRef = useRef(slides.length);
  const widthRef = useRef(0);
  const scrollRef = useRef<ComponentRef<typeof ScrollView> | null>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    lenRef.current = slides.length;
  }, [slides.length]);

  useEffect(() => {
    if (slides.length === 0) return;
    activeRef.current = 0;
    setActiveIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    const nextSlide = slides[(activeIndex + 1) % slides.length];
    if (nextSlide && typeof nextSlide.image === 'object' && 'uri' in nextSlide.image) {
      void Image.prefetch(nextSlide.image.uri).catch(() => null);
    }
  }, [activeIndex, slides]);

  const goTo = useCallback((next: number, animated = true) => {
    const len = lenRef.current;
    if (len < 2) return;
    const safeNext = ((next % len) + len) % len;
    if (safeNext === activeRef.current && animated) return;
    activeRef.current = safeNext;
    setActiveIndex(safeNext);
    if (widthRef.current > 0) {
      scrollRef.current?.scrollTo({ x: safeNext * widthRef.current, animated });
    }
  }, []);

  // ── Auto-play ─────────────────────────────────────────────────────────────
  const stopAuto = useCallback(() => {
    if (autoRef.current) { clearInterval(autoRef.current); autoRef.current = null; }
  }, []);

  const startAuto = useCallback(() => {
    stopAuto();
    if (lenRef.current < 2) return;
    autoRef.current = setInterval(() => goTo(activeRef.current + 1), autoPlayInterval);
  }, [goTo, stopAuto, autoPlayInterval]);

  useEffect(() => {
    startAuto();
    return stopAuto;
  }, [slides.length, startAuto, stopAuto]);

  const handleMomentumEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const width = widthRef.current;
    if (width <= 0) return;
    const index = Math.max(0, Math.min(lenRef.current - 1, Math.round(event.nativeEvent.contentOffset.x / width)));
    activeRef.current = index;
    setActiveIndex(index);
    startAuto();
  }, [startAuto]);

  if (slides.length === 0) return null;

  return (
    <View>
      <View
        style={[
          styles.card,
          { height, borderRadius },
        ]}
        onLayout={(event) => {
          const width = event.nativeEvent.layout.width;
          if (width <= 0 || width === widthRef.current) return;
          widthRef.current = width;
          setCardWidth(width);
          requestAnimationFrame(() => goTo(activeRef.current, false));
        }}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          bounces={false}
          scrollEnabled={slides.length > 1}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          onScrollBeginDrag={stopAuto}
          onScrollEndDrag={startAuto}
          onMomentumScrollEnd={handleMomentumEnd}
          scrollEventThrottle={16}
        >
          {slides.map((slide, index) => (
            <View
              key={index}
              style={[
                styles.slide,
                { width: cardWidth || 1, height },
                slide.backgroundColor
                  ? { backgroundColor: slide.backgroundColor }
                  : null,
              ]}
            >
              <Image
                source={slide.image as any}
                style={styles.image}
                resizeMode={slide.resizeMode ?? 'cover'}
                fadeDuration={0}
              />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* ── Dots ── */}
      {slides.length > 1 && (
        <View style={styles.dotsRow}>
          {slides.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                if (index === activeRef.current) return;
                stopAuto();
                goTo(index);
                startAuto();
              }}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View
                style={[
                  styles.dot,
                  darkMode ? styles.dotDark : null,
                  index === activeIndex
                    ? darkMode ? styles.dotActiveDark : styles.dotActive
                    : null,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: '#173E80',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 22,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C7D2E3',
  },
  dotDark: { backgroundColor: '#334155' },
  dotActive: { width: 28, backgroundColor: '#0F172A' },
  dotActiveDark: { width: 28, backgroundColor: '#E2E8F0' },
});
