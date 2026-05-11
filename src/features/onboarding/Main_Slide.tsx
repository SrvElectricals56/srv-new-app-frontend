import React from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';

export type UserRole = 'user' | 'dealer' | 'electrician' | 'counter-boy';

interface MainSlideProps {
  onRoleSelect: (role: UserRole) => void;
}

const { width, height } = Dimensions.get('window');

const FRONT_PAGE = require('../../../assets/frontpage.jpeg');
const IMAGE_WIDTH = 1253;
const IMAGE_HEIGHT = 2560;
const PAGE_BG = '#F2F0F1';

const TAP_AREAS: Array<{
  role: UserRole;
  left: number;
  top: number;
  width: number;
  height: number;
}> = [
  { role: 'dealer', left: 0.03, top: 0.345, width: 0.462, height: 0.285 },
  { role: 'electrician', left: 0.5, top: 0.345, width: 0.47, height: 0.285 },
  { role: 'user', left: 0.03, top: 0.64, width: 0.462, height: 0.255 },
  { role: 'counter-boy', left: 0.5, top: 0.64, width: 0.47, height: 0.255 },
];

export default function MainSlide({ onRoleSelect }: MainSlideProps) {
  const bannerWidth = width * 0.985;
  const bannerHeight = height * 0.965;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.wrapper}>
        <View style={[styles.bannerWrap, { width: bannerWidth, height: bannerHeight }]}>
          <Image source={FRONT_PAGE} style={styles.banner} resizeMode="contain" />
          {TAP_AREAS.map((area) => (
            <Pressable
              key={area.role}
              accessibilityRole="button"
              accessibilityLabel={`${area.role} profile`}
              style={[
                styles.tapArea,
                {
                  left: bannerWidth * area.left,
                  top: bannerHeight * area.top,
                  width: bannerWidth * area.width,
                  height: bannerHeight * area.height,
                },
              ]}
              onPress={() => onRoleSelect(area.role)}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  wrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: PAGE_BG,
    paddingTop: 6,
  },
  bannerWrap: {
    position: 'relative',
    backgroundColor: PAGE_BG,
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  tapArea: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
});
