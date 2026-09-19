import { LocalizedText as Text } from '@/shared/preferences/LocalizedNative';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

/** Measure the actual panel: screen width is not the width of a nested Android pager. */
export function ProductImageCarousel({ images, height = 220 }: { images: string[]; height?: number }) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  return (
    <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ width: '100%' }}>
      {width > 0 && (
        <ScrollView horizontal pagingEnabled nestedScrollEnabled directionalLockEnabled
          removeClippedSubviews={false} showsHorizontalScrollIndicator={false}
          style={{ width, height }} contentContainerStyle={{ alignItems: 'center' }}
          onMomentumScrollEnd={event => setIndex(Math.max(0, Math.min(images.length - 1, Math.round(event.nativeEvent.contentOffset.x / width))))}>
          {images.map((uri, itemIndex) => <Image key={`${uri}-${itemIndex}`} source={{ uri }} contentFit="contain" style={{ width, height }} />)}
        </ScrollView>
      )}
      {images.length > 1 && <Text style={styles.position}>{Math.min(index + 1, images.length)} / {images.length}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({ position: { textAlign: 'center', color: '#64748B', fontSize: 12, marginTop: 4 } });
