import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon, C } from '@/features/profile/components/ProfileShared';
import {
  supportsNativeAnimatedDriver,
  withWebSafeNativeDriver,
} from '@/shared/animations/nativeDriver';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';

interface GetStartedScreenProps {
  onComplete: (role: 'electrician' | 'dealer' | 'user') => void;
}

// Animated product ticker — cycles through real SRV products inside the stat card
const PRODUCTS = [
  { label: 'Stabilizer', color: '#E8453C', bg: '#FEE2E2', image: require('../../../assets/Product/Voltage Stabilizer.png'), zoom: 1 },
  { label: 'Fan Box', color: '#7C3AED', bg: '#EDE9FE', image: require('../../../assets/Product/Fan box.png'), zoom: 1 },
  { label: 'Concealed Box', color: '#2563EB', bg: '#DBEAFE', image: require('../../../assets/Product/Concelead Box.png'), zoom: 1 },
  { label: 'Modular Box', color: '#059669', bg: '#D1FAE5', image: require('../../../assets/Product/Modular_Box.png'), zoom: 1 },
  { label: 'Junction Box', color: '#D97706', bg: '#FEF3C7', image: require('../../../assets/Product/Junction_Box.png'), zoom: 1 },
  { label: 'PVC Conduit Pipe', color: '#0891B2', bg: '#CFFAFE', image: require('../../../assets/Product/PVC Conduit Pipe.png'), zoom: 1 },
  { label: 'MCB Box', color: '#E8453C', bg: '#FEE2E2', image: require('../../../assets/Product/MCB Distribuation Box.png'), zoom: 1 },
  { label: 'Change Over Switch', color: '#7C3AED', bg: '#EDE9FE', image: require('../../../assets/Product/AUTOMATIC CHANGE OVER.png'), zoom: 1 },
];

function ProductTickerCard() {
  const [activeIdx, setActiveIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(1)).current;
  const isAnimating = useRef(false);

  const goToProduct = (index: number) => {
    if (index === activeIdx || isAnimating.current) return;
    
    isAnimating.current = true;
    const direction = index > activeIdx ? -30 : 30;
    
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: supportsNativeAnimatedDriver }),
      Animated.timing(slideAnim, { toValue: direction, duration: 250, useNativeDriver: supportsNativeAnimatedDriver }),
      Animated.timing(imageScale, { toValue: 0.85, duration: 250, useNativeDriver: supportsNativeAnimatedDriver }),
    ]).start(() => {
      setActiveIdx(index);
      slideAnim.setValue(-direction);
      imageScale.setValue(1.15);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: supportsNativeAnimatedDriver }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: supportsNativeAnimatedDriver, tension: 60, friction: 9 }),
        Animated.spring(imageScale, { toValue: 1, useNativeDriver: supportsNativeAnimatedDriver, tension: 50, friction: 8 }),
      ]).start(() => {
        isAnimating.current = false;
      });
    });
  };

  const goToNext = () => {
    const next = (activeIdx + 1) % PRODUCTS.length;
    goToProduct(next);
  };

  const goToPrev = () => {
    const prev = (activeIdx - 1 + PRODUCTS.length) % PRODUCTS.length;
    goToProduct(prev);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 50) {
          goToPrev();
        } else if (gestureState.dx < -50) {
          goToNext();
        }
      },
    })
  ).current;

  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(() => {
      if (cancelled) return;
      goToNext();
    }, 2500);
    return () => { cancelled = true; clearInterval(interval); };
  }, [activeIdx]);

  const product = PRODUCTS[activeIdx];

  return (
    <View style={tickerCardStyles.wrapper}>
      <View style={[tickerCardStyles.card, { backgroundColor: product.bg }]}>
        <View style={tickerCardStyles.topSection}>
          <View style={[tickerCardStyles.iconBadge, { backgroundColor: product.color }]}>
            <Text style={tickerCardStyles.iconText}>⚡</Text>
          </View>
          <Text style={[tickerCardStyles.categoryText, { color: product.color }]}>
            OUR PRODUCTS
          </Text>
        </View>

        <View 
          style={tickerCardStyles.contentSection}
          {...panResponder.panHandlers}
        >
          <Animated.View
            style={[
              tickerCardStyles.imageContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: imageScale }],
              }
            ]}
          >
            <Image 
              source={product.image} 
              style={[
                tickerCardStyles.productImage,
                { 
                  transform: [{ scale: product.zoom || 1 }]
                }
              ]}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.View
            style={{
              flex: 1,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text 
              style={[tickerCardStyles.productText, { color: product.color }]} 
              numberOfLines={3}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {product.label}
            </Text>
          </Animated.View>
        </View>

        <View style={tickerCardStyles.bottomBar}>
          <View style={tickerCardStyles.dotsContainer}>
            {PRODUCTS.map((_, i) => (
              <View
                key={i}
                style={[
                  tickerCardStyles.dot,
                  {
                    backgroundColor: i === activeIdx ? product.color : product.color + '30',
                    width: i === activeIdx ? 20 : 6,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const tickerCardStyles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginVertical: 2,
  },
  card: {
    borderRadius: 18,
    padding: 12,
    minHeight: 130,
    ...createShadow({ color: '#000', offsetY: 3, blur: 10, opacity: 0.12, elevation: 4 }),
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  contentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  imageContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: 80,
    height: 80,
  },
  productText: {
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 23,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    flexWrap: 'wrap',
  },
  bottomBar: {
    marginTop: 'auto',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});

export function GetStartedScreen({ onComplete }: GetStartedScreenProps) {
  const { tx, theme, darkMode } = usePreferenceContext();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth <= 360;
  const isMediumScreen = screenWidth > 360 && screenWidth <= 768;
  const isCompactScreen = screenWidth <= 380;
  const bottomSectionPaddingBottom = isSmallScreen ? 18 : isMediumScreen ? 24 : 28;
  // Per-slide baseline — NOT tied to Back/Continue visibility. Slide 0 must keep a stable
  // padding when returning from slides 1–3; linking all slides to `showContinueButton`
  // caused every panel to jump (90→24) when `currentIndex` hit 0 and looked glitchy under the pager.
  const profileSlideBottomPad = 24;
  const roleSlideBottomPad = 90;
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAudience, setSelectedAudience] = useState<'user' | 'dealer' | 'electrician' | null>(
    null
  );
  const scrollX = useRef(new Animated.Value(0)).current;
  /** Integer page width avoids fractional snapping glitches between horizontal pages */
  const pageWidth = Math.max(1, Math.round(screenWidth));

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // Individual sparkle animations (from file 1)
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;
  const sparkle4 = useRef(new Animated.Value(0)).current;
  const sparkle5 = useRef(new Animated.Value(0)).current;
  const sparkle6 = useRef(new Animated.Value(0)).current;
  const sparkle7 = useRef(new Animated.Value(0)).current;
  const sparkle8 = useRef(new Animated.Value(0)).current;
  const sparkleRotate = useRef(new Animated.Value(0)).current;

  const totalSlides = 4;

  // One-time entry animation
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(24);
    logoScale.setValue(0.8);
    logoOpacity.setValue(0);

    const animations: Animated.CompositeAnimation[] = [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: supportsNativeAnimatedDriver,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: supportsNativeAnimatedDriver,
        tension: 55,
        friction: 9,
      }),
    ];

    animations.push(
      Animated.spring(logoScale, {
        toValue: 1,
        useNativeDriver: supportsNativeAnimatedDriver,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: supportsNativeAnimatedDriver,
      })
    );

    Animated.parallel(animations).start();
  }, [fadeAnim, logoOpacity, logoScale, slideAnim]);

  // Individual sparkle animations (from file 1)
  useEffect(() => {
    let rotateAnimLoop: Animated.CompositeAnimation | null = null;
    const sparkleAnims: Animated.CompositeAnimation[] = [];

    if (currentIndex === 0) {
      sparkleRotate.setValue(0);
      rotateAnimLoop = Animated.loop(
        Animated.timing(
          sparkleRotate,
          withWebSafeNativeDriver({
            toValue: 1,
            duration: 4000,
          })
        )
      );
      rotateAnimLoop.start();

      const makeSparkleAnim = (
        sparkle: Animated.Value,
        delay: number,
        duration: number = 1200
      ): Animated.CompositeAnimation => {
        sparkle.setValue(0);
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(
              sparkle,
              withWebSafeNativeDriver({
                toValue: 1,
                duration: duration * 0.5,
              })
            ),
            Animated.timing(
              sparkle,
              withWebSafeNativeDriver({
                toValue: 0,
                duration: duration * 0.5,
              })
            ),
          ])
        );
      };

      sparkleAnims.push(makeSparkleAnim(sparkle1, 0, 1200));
      sparkleAnims.push(makeSparkleAnim(sparkle2, 150, 1000));
      sparkleAnims.push(makeSparkleAnim(sparkle3, 300, 1100));
      sparkleAnims.push(makeSparkleAnim(sparkle4, 450, 900));
      sparkleAnims.push(makeSparkleAnim(sparkle5, 200, 1300));
      sparkleAnims.push(makeSparkleAnim(sparkle6, 350, 1400));
      sparkleAnims.push(makeSparkleAnim(sparkle7, 100, 800));
      sparkleAnims.push(makeSparkleAnim(sparkle8, 400, 1100));

      sparkleAnims.forEach((anim) => anim.start());
    }

    return () => {
      if (rotateAnimLoop) rotateAnimLoop.stop();
      sparkleAnims.forEach((anim) => anim.stop());
    };
  }, [
    currentIndex,
    sparkle1,
    sparkle2,
    sparkle3,
    sparkle4,
    sparkle5,
    sparkle6,
    sparkle7,
    sparkle8,
    sparkleRotate,
  ]);

  const clampPageIndex = useCallback((i: number) => Math.min(totalSlides - 1, Math.max(0, i)), [totalSlides]);

  const scrollPagerToPage = useCallback(
    (pageIndex: number, animated: boolean) => {
      const x = pageIndex * pageWidth;
      scrollRef.current?.scrollTo({ x, animated });
    },
    [pageWidth]
  );

  const snapBackToChooseProfile = useCallback(() => {
    scrollX.setValue(0);
    scrollPagerToPage(0, false);
    setCurrentIndex(0);
    setSelectedAudience(null);
  }, [scrollPagerToPage, scrollX]);

  const handleMomentumScrollEnd = (event: any) => {
    const offset = event.nativeEvent.contentOffset?.x ?? 0;
    const raw = clampPageIndex(Math.round(offset / pageWidth));
    if (raw !== currentIndex) {
      setCurrentIndex(raw);
    }
  };

  const goToSlide = (index: number) => {
    scrollPagerToPage(clampPageIndex(index), true);
  };

  const handleRoleSelect = (audience: 'user' | 'dealer' | 'electrician') => {
    setSelectedAudience(audience);
    if (audience === 'user') {
      scrollPagerToPage(1, true);
      setCurrentIndex(1);
      return;
    }

    // Jump without animation so scroll doesn't pass through slide 1 (user) causing a flash
    const targetIndex = audience === 'dealer' ? 2 : 3;
    scrollPagerToPage(targetIndex, false);
    setCurrentIndex(targetIndex);
  };

  const handleContinue = () => {
    if (currentIndex === 1) {
      onComplete('user');
      return;
    }

    if (currentIndex === 2) {
      onComplete('dealer');
      return;
    }

    if (currentIndex === 3) {
      onComplete('electrician');
    }
  };

  const slideGradients = [
    { start: '#E8453C', end: '#FF6B6B', icon: 'star' as const },
    { start: '#7C3AED', end: '#A78BFA', icon: 'star' as const },
    { start: '#2563EB', end: '#60A5FA', icon: 'refer' as const },
    { start: '#DE3B30', end: '#F87171', icon: 'redeem' as const },
  ];

  const currentGradient = slideGradients[currentIndex];

  useEffect(() => {
    if (currentIndex !== 1 || selectedAudience !== 'user') {
      return;
    }

    // Removed auto-redirect - user will click continue button instead
  }, [currentIndex, selectedAudience]);

  const showContinueButton = selectedAudience !== null && (currentIndex === 1 || currentIndex === 2 || currentIndex === 3);

  // --- Slide 1: Individual animated sparkles from file 1, content from file 2 ---
  const Slide1 = () => {
    const rotate = sparkleRotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const sparkleValues = [
      sparkle1,
      sparkle2,
      sparkle3,
      sparkle4,
      sparkle5,
      sparkle6,
      sparkle7,
      sparkle8,
    ];

    const dotSparkleData = [
      { size: 12, color: C.gold, pos: styles.sparkleTopLeft },
      { size: 8, color: C.primary, pos: styles.sparkleTopRight },
      { size: 10, color: C.teal, pos: styles.sparkleBottomLeft },
      { size: 6, color: C.gold, pos: styles.sparkleBottomRight },
      { size: 9, color: C.primary, pos: styles.sparkleLeft },
      { size: 7, color: C.teal, pos: styles.sparkleRight },
      { size: 8, color: C.gold, pos: styles.sparkleTop },
      { size: 6, color: C.primary, pos: styles.sparkleBottom },
    ];

    const starSparkleData = [
      { color: C.gold, pos: styles.starTopLeft, sparkleIdx: 0 },
      { color: C.primary, pos: styles.starTopRight, sparkleIdx: 1 },
      { color: C.teal, pos: styles.starBottomLeft, sparkleIdx: 2 },
      { color: C.gold, pos: styles.starBottomRight, sparkleIdx: 3 },
    ];

    return (
      <View>
        <View style={[styles.cardHeader, { backgroundColor: '#FFFFFF' }]}>
          <Animated.View
            style={{
              transform: [{ scale: logoScale }],
              opacity: logoOpacity,
            }}
          >
            <Animated.View style={styles.logoGlow}>
              <Image
                source={require('../../../assets/srv-login-logo.png')}
                style={styles.cardLogo}
                resizeMode="contain"
              />
            </Animated.View>
          </Animated.View>

          {/* Dot sparkles */}
          {dotSparkleData.map((item, i) => {
            const scale = sparkleValues[i];
            return (
              <Animated.View
                key={`dot-sparkle-${i}`}
                style={[
                  {
                    position: 'absolute',
                    width: item.size,
                    height: item.size,
                    borderRadius: item.size / 2,
                    backgroundColor: item.color,
                  },
                  item.pos,
                  {
                    opacity: scale,
                    transform: [{ rotate }, { scale }],
                  },
                ]}
              />
            );
          })}

          {/* Star sparkles */}
          {starSparkleData.map((item, i) => {
            const scale = sparkleValues[item.sparkleIdx];
            return (
              <Animated.View
                key={`star-sparkle-${i}`}
                style={[
                  { position: 'absolute' },
                  item.pos,
                  {
                    opacity: scale,
                    transform: [{ rotate }, { scale }],
                  },
                ]}
              >
                <Text style={[styles.starText, { color: item.color }]}>✦</Text>
              </Animated.View>
            );
          })}
        </View>

        {/* Content from file 2 */}
        <View style={styles.cardBody}>
          <View style={styles.tricolorWrapper}>
            <View style={styles.tricolorContainer}>
              <View style={[styles.tricolorBar, { backgroundColor: '#FF9933' }]} />
              <View style={[styles.tricolorBar, { backgroundColor: '#FFFFFF' }]} />
              <View style={[styles.tricolorBar, { backgroundColor: '#138808' }]} />
            </View>
          </View>

          <Text style={[styles.welcomeText, { color: C.primary }]}>{tx('Welcome to SRV')}</Text>
          <Text style={[styles.sinceText, { color: theme.textPrimary }]}>
            {tx("North India's Largest Metal Box Manufacturer")}
          </Text>

          <View style={styles.roleSelectorWrap}>
            {/* Animated "Choose your profile" heading */}
            <View style={styles.roleSelectorTitleRow}>
              <View style={[styles.roleSelectorTitleLine, { backgroundColor: C.primary }]} />
              <Text style={[styles.roleSelectorTitle, { color: theme.textPrimary }]}>
                {tx('Choose your profile')}
              </Text>
              <View style={[styles.roleSelectorTitleLine, { backgroundColor: C.primary }]} />
            </View>
            <View style={styles.roleSelectorRow}>
              {(
                [
                  {
                    key: 'user' as const,
                    label: tx('Customer'),
                    sub: tx('Browse products'),
                    image: require('../../../assets/user.jpeg'),
                    color: '#7C3AED',
                    bg: '#F5F3FF',
                    activeBg: '#EDE9FE',
                    border: '#C4B5FD',
                  },
                  {
                    key: 'dealer' as const,
                    label: tx('Dealer'),
                    sub: tx('Grow your Business'),
                    image: require('../../../assets/Dealer.png'),
                    color: '#2563EB',
                    bg: '#EFF6FF',
                    activeBg: '#DBEAFE',
                    border: '#93C5FD',
                  },
                  {
                    key: 'electrician' as const,
                    label: tx('Electrician'),
                    sub: tx('Scan & earn'),
                    image: require('../../../assets/new electrician.png'),
                    color: '#DE3B30',
                    bg: '#FEF2F2',
                    activeBg: '#FEE2E2',
                    border: '#FECACA',
                  },
                ] as const
              ).map((role, idx) => {
                const isActive = selectedAudience === role.key;
                const scaleAnim = useRef(new Animated.Value(1)).current;
                const entryAnim = useRef(new Animated.Value(0)).current;
                const entrySlide = useRef(new Animated.Value(20)).current;

                useEffect(() => {
                  Animated.parallel([
                    Animated.timing(entryAnim, {
                      toValue: 1,
                      duration: 400,
                      delay: 120 + idx * 100,
                      useNativeDriver: supportsNativeAnimatedDriver,
                    }),
                    Animated.spring(entrySlide, {
                      toValue: 0,
                      delay: 120 + idx * 100,
                      useNativeDriver: supportsNativeAnimatedDriver,
                      tension: 60,
                      friction: 9,
                    }),
                  ]).start();
                }, [entryAnim, entrySlide]);

                const handlePressIn = () => {
                  Animated.spring(scaleAnim, {
                    toValue: 0.93,
                    useNativeDriver: supportsNativeAnimatedDriver,
                    tension: 120,
                    friction: 8,
                  }).start();
                };
                const handlePressOut = () => {
                  Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: supportsNativeAnimatedDriver,
                    tension: 80,
                    friction: 6,
                  }).start();
                };

                return (
                  <Pressable
                    key={role.key}
                    onPress={() => handleRoleSelect(role.key)}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    style={{ flex: 1 }}
                  >
                    <Animated.View
                      style={{
                        transform: [{ scale: scaleAnim }, { translateY: entrySlide }],
                        opacity: entryAnim,
                      }}
                    >
                      <View
                        style={[
                          styles.roleCard,
                          {
                            borderColor: isActive ? role.color : role.border,
                            borderWidth: isActive ? 2 : 1,
                          },
                        ]}
                      >
                        <Image
                          source={role.image}
                          style={[
                            styles.roleCardImage,
                            role.key === 'user' && {
                              transform: [{ scale: 1.5 }],
                              top: 5,
                            },
                            role.key === 'dealer' && {
                              transform: [{ scale: 1.8 }],
                            }
                          ]}
                          resizeMode="cover"
                        />
                        {isActive && (
                          <View style={[styles.roleCardCheck, { backgroundColor: role.color }]}>
                            <Text style={styles.roleCardCheckText}>✓</Text>
                          </View>
                        )}
                      </View>

                      {/* Stylish label below card */}
                      <View style={styles.roleCardLabelWrap}>
                        <View
                          style={[
                            styles.roleCardPill,
                            {
                              backgroundColor: isActive ? role.color : role.bg,
                              borderColor: isActive ? role.color : role.border,
                            },
                          ]}
                        >
                          <Text
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            style={[styles.roleCardLabel, { color: isActive ? '#fff' : role.color }]}
                          >
                            {role.label}
                          </Text>
                        </View>
                        <Text style={[styles.roleCardSub, { color: isActive ? role.color : '#94A3B8' }]}>
                          {role.sub}
                        </Text>
                      </View>
                    </Animated.View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.statsHighlightRow}>
            <View style={[styles.statsHighlightCard, styles.statsHighlightCardSmall, { backgroundColor: C.primaryLight }]}>
              <Text style={[styles.statsHighlightNum, { color: C.primary }]}>25+</Text>
              <Text style={[styles.statsHighlightLabel, { color: C.primary }]}>{tx('Years')}</Text>
            </View>
            <View style={[styles.statsHighlightCard, styles.statsHighlightCardSmall, { backgroundColor: C.goldLight }]}>
              <Text style={[styles.statsHighlightNum, { color: C.gold }]}>250+</Text>
              <Text style={[styles.statsHighlightLabel, { color: C.gold }]}>{tx('Products')}</Text>
            </View>
          </View>

          {/* Full Width Animated Products Section */}
          <View style={styles.productsSection}>
            <ProductTickerCard />
          </View>

          <Text style={[styles.trustText, { color: C.gold }]}>
            ✦ {tx('25 Years of Trust & Improvement')} ✦
          </Text>

        </View>
      </View>
    );
  };

  const Slide2 = () => {
    const badge1Float = useRef(new Animated.Value(0)).current;
    const badge2Float = useRef(new Animated.Value(0)).current;
    const circlePulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      if (currentIndex !== 1) return;

      const float1 = Animated.loop(
        Animated.sequence([
          Animated.timing(badge1Float, {
            toValue: -10,
            duration: 2000,
            useNativeDriver: supportsNativeAnimatedDriver,
          }),
          Animated.timing(badge1Float, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: supportsNativeAnimatedDriver,
          }),
        ])
      );

      const float2 = Animated.loop(
        Animated.sequence([
          Animated.timing(badge2Float, {
            toValue: -8,
            duration: 2500,
            useNativeDriver: supportsNativeAnimatedDriver,
          }),
          Animated.timing(badge2Float, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: supportsNativeAnimatedDriver,
          }),
        ])
      );

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(circlePulse, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: supportsNativeAnimatedDriver,
          }),
          Animated.timing(circlePulse, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: supportsNativeAnimatedDriver,
          }),
        ])
      );

      float1.start();
      float2.start();
      pulse.start();

      return () => {
        float1.stop();
        float2.stop();
        pulse.stop();
      };
    }, [currentIndex, badge1Float, badge2Float, circlePulse]);

    return (
      <View style={{ flex: 1 }}>
        <View style={[styles.bannerHeader, { height: Math.round(screenWidth * (768 / 1376)), overflow: 'hidden', backgroundColor: '#EFF6FF' }]}>
          <Image
            source={require('../../../assets/user_banner_3.png')}
            style={{ 
              width: screenWidth, 
              height: Math.round(screenWidth * (768 / 1376)) + 20,
              position: 'absolute',
              bottom: 0,
              left: 0,
            }}
            resizeMode="cover"
          />
        </View>

        <View style={[styles.cardBody, isCompactScreen && styles.cardBodyCompact]}>
          <View style={[styles.modernBadge, { backgroundColor: '#7C3AED' }]}>
            <Text style={styles.modernBadgeText}>FOR OUR SRV CUSTOMERS</Text>
          </View>
          
          <Text style={[styles.heroTitleCompact, { color: theme.textPrimary }]}>
            {tx('Discover Quality')}
          </Text>
          <Text style={[styles.heroTitleAccentCompact, { color: '#7C3AED' }]}>
            {tx('Electrical Solutions')}
          </Text>
          <Text style={[styles.heroSubtitleCompact, { color: theme.textSecondary }]}>
            {tx('Browse 250+ certified products for your home & business')}
          </Text>

          <View style={styles.benefitGridCompact}>
            <View style={[styles.benefitCardCompact, { backgroundColor: '#F5F3FF' }]}>
              <View style={[styles.benefitIconBoxCompact, { backgroundColor: '#7C3AED' }]}>
                <AppIcon name="redeem" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.benefitTitleCompact, { color: theme.textPrimary }]}>
                {tx('ISI Certified Products')}
              </Text>
            </View>

            <View style={[styles.benefitCardCompact, { backgroundColor: '#EDE9FE' }]}>
              <View style={[styles.benefitIconBoxCompact, { backgroundColor: '#6D28D9' }]}>
                <AppIcon name="order" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.benefitTitleCompact, { color: theme.textPrimary }]}>
                {tx('Various Product Categories')}
              </Text>
            </View>

            <View style={[styles.benefitCardCompact, { backgroundColor: '#F5F3FF' }]}>
              <View style={[styles.benefitIconBoxCompact, { backgroundColor: '#8B5CF6' }]}>
                <AppIcon name="location" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.benefitTitleCompact, { color: theme.textPrimary }]}>
                {tx('Pan India Delivery')}
              </Text>
            </View>

            <View style={[styles.benefitCardCompact, { backgroundColor: '#EDE9FE' }]}>
              <View style={[styles.benefitIconBoxCompact, { backgroundColor: '#5B21B6' }]}>
                <AppIcon name="gift" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.benefitTitleCompact, { color: theme.textPrimary }]}>
                {tx('Trusted Since 2000')}
              </Text>
            </View>
          </View>

          <View style={[styles.highlightBoxCompact, { backgroundColor: '#F5F3FF', borderColor: '#7C3AED' }]}>
            <Text style={[styles.highlightTextCompact, { color: '#7C3AED' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              ✦ {tx('Trusted by 50,000+ Customers across North India')} ✦
            </Text>
          </View>

          <Text style={[styles.trustText, { color: C.gold, marginTop: 12 }]}>
            ✦ {tx('25 Years of Trust & Improvement')} ✦
          </Text>
        </View>
      </View>
    );
  };

  // --- Slide 3: Dealer ---
  const Slide3 = ({
    gradient,
  }: {
    gradient: { start: string; end: string; icon: 'star' | 'refer' | 'redeem' };
  }) => {
    const badge1Float = useRef(new Animated.Value(0)).current;
    const badge2Float = useRef(new Animated.Value(0)).current;
    const badge1Rotate = useRef(new Animated.Value(0)).current;
    const circlePulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      if (currentIndex !== 2) return;

      const float1 = Animated.loop(
        Animated.sequence([
          Animated.timing(badge1Float, {
            toValue: -12,
            duration: 2200,
            useNativeDriver: supportsNativeAnimatedDriver,
          }),
          Animated.timing(badge1Float, {
            toValue: 0,
            duration: 2200,
            useNativeDriver: supportsNativeAnimatedDriver,
          }),
        ])
      );

      const float2 = Animated.loop(
        Animated.sequence([
          Animated.timing(badge2Float, {
            toValue: -9,
            duration: 2700,
            useNativeDriver: supportsNativeAnimatedDriver,
          }),
          Animated.timing(badge2Float, {
            toValue: 0,
            duration: 2700,
            useNativeDriver: supportsNativeAnimatedDriver,
          }),
        ])
      );

      const rotate = Animated.loop(
        Animated.timing(badge1Rotate, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: supportsNativeAnimatedDriver,
        })
      );

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(circlePulse, {
            toValue: 1.06,
            duration: 1600,
            useNativeDriver: supportsNativeAnimatedDriver,
          }),
          Animated.timing(circlePulse, {
            toValue: 1,
            duration: 1600,
            useNativeDriver: supportsNativeAnimatedDriver,
          }),
        ])
      );

      float1.start();
      float2.start();
      rotate.start();
      pulse.start();

      return () => {
        float1.stop();
        float2.stop();
        rotate.stop();
        pulse.stop();
      };
    }, [currentIndex, badge1Float, badge2Float, badge1Rotate, circlePulse]);

    const rotateInterpolate = badge1Rotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={{ flex: 1 }}>
        <View style={[styles.bannerHeader, { backgroundColor: '#F5F3FF', height: Math.round(screenWidth * (720 / 1440)), overflow: 'hidden' }]}>
          <Image
            source={require('../../../assets/dealer banner final.png')}
            style={{ width: screenWidth, height: Math.round(screenWidth * (720 / 1440)) }}
            resizeMode="cover"
          />
        </View>

        <View style={[styles.cardBody, isCompactScreen && styles.cardBodyCompact]}>
          <View style={[styles.modernBadge, { backgroundColor: gradient.start }]}>
            <Text style={styles.modernBadgeText}>FOR OUR SRV DEALERS</Text>
          </View>
          
          <View
            style={[
              styles.dealerChannelCard,
              isCompactScreen && styles.dealerChannelCardCompact,
            ]}
          >
            <LinearGradient
              colors={['#FAF5FF', '#FFFFFF', '#F5F3FF']}
              locations={[0, 0.45, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View pointerEvents="none" style={[styles.dealerChannelCardSheen]} />
            <View style={styles.dealerChannelCardRow}>
              <View style={styles.dealerChannelAccentRailWrap}>
                <LinearGradient
                  colors={[gradient.start, gradient.end]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.dealerChannelAccentRailGrad}
                />
              </View>
              <View
                style={[
                  styles.dealerChannelCopyCol,
                  isCompactScreen && styles.dealerChannelCopyColCompact,
                ]}
              >
                <View style={[styles.dealerChannelIconRow, isCompactScreen && styles.dealerChannelIconRowCompact]}>
                  <LinearGradient
                    colors={[gradient.start, gradient.end]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.dealerChannelIconGlow, isCompactScreen && styles.dealerChannelIconGlowCompact]}
                  >
                    <AppIcon
                      name="refer"
                      size={isCompactScreen ? 14 : 16}
                      color="#FFFFFF"
                      strokeWidth={1.9}
                    />
                  </LinearGradient>
                </View>
                <Text
                  style={[
                    styles.dealerChannelEyebrow,
                    isCompactScreen && styles.dealerChannelEyebrowCompact,
                    { color: gradient.start },
                  ]}
                >
                  {tx('Partnership')}
                </Text>
                <Text
                  style={[
                    styles.dealerChannelHeadline,
                    isCompactScreen && styles.dealerChannelHeadlineCompact,
                    { color: darkMode ? '#F5F3FF' : '#4C1D95' },
                  ]}
                >
                  {tx('Thank You for Being the Channel Partner')}
                </Text>
                <View
                  style={[styles.dealerMsgDividerWrap, isCompactScreen && styles.dealerMsgDividerWrapCompact]}
                >
                  <View
                    style={[
                      styles.dealerMsgDividerLine,
                      { backgroundColor: darkMode ? 'rgba(196,181,253,0.35)' : 'rgba(91,33,182,0.2)' },
                    ]}
                  />
                  <Text style={[styles.dealerMsgDividerGem, { color: gradient.start }]}>◇</Text>
                  <View
                    style={[
                      styles.dealerMsgDividerLine,
                      { backgroundColor: darkMode ? 'rgba(196,181,253,0.35)' : 'rgba(91,33,182,0.2)' },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.dealerChannelBody,
                    isCompactScreen && styles.dealerChannelBodyCompact,
                    { color: darkMode ? '#DDD6FE' : '#6B21A8' },
                  ]}
                >
                  {tx(
                    'Let us build a strong relationship to ensure the distribution of SRV product range to every corner of India.'
                  )}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.megaStatsRowCompact}>
            <View style={[styles.megaStatCardCompact, styles.megaStatCardDealerTriple, { backgroundColor: '#F5F3FF' }]}>
              <Text style={[styles.megaStatNumCompact, styles.megaStatNumTriple, { color: gradient.start }]}>
                1000+
              </Text>
              <Text style={[styles.megaStatLabelCompact, { color: gradient.start }]}>{tx('Dealers')}</Text>
            </View>
            <View style={[styles.megaStatCardCompact, styles.megaStatCardDealerTriple, { backgroundColor: C.goldLight }]}>
              <Text style={[styles.megaStatNumCompact, styles.megaStatNumTriple, { color: C.gold }]}>₹50L+</Text>
              <Text style={[styles.megaStatLabelCompact, { color: C.gold }]}>{tx('Rewards')}</Text>
            </View>
            <View style={[styles.megaStatCardCompact, styles.megaStatCardDealerTriple, { backgroundColor: '#EDE9FE' }]}>
              <Text style={[styles.megaStatNumCompact, styles.megaStatNumTriple, { color: gradient.start }]}>
                8+
              </Text>
              <Text style={[styles.megaStatLabelCompact, { color: gradient.start }]}>{tx('States')}</Text>
            </View>
          </View>

          <View style={styles.powerFeaturesCompact}>
            <View style={[styles.powerFeatureCardCompact, { backgroundColor: '#F5F3FF' }]}>
              <View style={[styles.powerFeatureIconCompact, { backgroundColor: gradient.start }]}>
                <AppIcon name="star" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.powerFeatureTitleCompact, { color: theme.textPrimary }]}>
                {tx('Premium Range of Products')}
              </Text>
            </View>

            <View style={[styles.powerFeatureCardCompact, { backgroundColor: C.goldLight }]}>
              <View style={[styles.powerFeatureIconCompact, { backgroundColor: C.gold }]}>
                <AppIcon name="offer" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.powerFeatureTitleCompact, { color: theme.textPrimary }]}>
                {tx('Best Offer & Discount')}
              </Text>
            </View>
          </View>

          <View style={[styles.highlightBoxCompact, { backgroundColor: '#F5F3FF', borderColor: gradient.start }]}>
            <Text style={[styles.highlightTextCompact, { color: gradient.start }]}>
              ✦ {tx('Trusted by 1000+ dealers across North India')} ✦
            </Text>
          </View>

          <Text style={[styles.trustText, { color: C.gold, marginTop: 12 }]}>
            ✦ {tx('25 Years of Trust & Improvement')} ✦
          </Text>
        </View>
      </View>
    );
  };

  // --- Slide 4: Electrician ---
  const Slide4 = ({
    gradient,
  }: {
    gradient: { start: string; end: string; icon: 'star' | 'refer' | 'redeem' };
  }) => {
    return (
      <View style={{ flex: 1 }}>
        <View style={[styles.bannerHeader, { backgroundColor: '#FEF2F2', height: isCompactScreen ? 154 : 160 }]}>
          <ExpoImage
            source={require('../../../assets/electrician_banner1.jpg')}
            style={styles.electricianBannerImageFill}
            contentFit="cover"
            contentPosition="top center"
            accessibilityLabel="SRV electricians onboarding banner"
          />
        </View>

        <View style={[styles.cardBody, isCompactScreen && styles.cardBodyCompact]}>
          <View style={[styles.modernBadge, { backgroundColor: gradient.start }]}>
            <Text style={styles.modernBadgeText}>FOR OUR SRV ELECTRICIANS</Text>
          </View>
          
          <Text style={[styles.heroTitleCompact, { color: theme.textPrimary }]}>
            {tx('Scan Products')}
          </Text>
          <Text style={[styles.heroTitleAccentCompact, { color: gradient.start }]}>
            {tx('Earn Instant Rewards')}
          </Text>
          <Text style={[styles.heroSubtitleCompact, { color: theme.textSecondary }]}>
            {tx('Get paid for every SRV product you install')}
          </Text>

          <View style={styles.rewardShowcaseCompact}>
            <View style={[styles.rewardCardCompact, { backgroundColor: gradient.start }]}>
              <View style={styles.rewardCardIconWrapCompact}>
                <AppIcon name="scan" size={24} color="#FFFFFF" strokeWidth={2.1} />
              </View>
              <Text style={styles.rewardCardTitleCompact}>{tx('Scan QR')}</Text>
            </View>
            <View style={styles.rewardArrowCompact}>
              <Text style={styles.rewardArrowTextCompact}>→</Text>
            </View>
            <View style={[styles.rewardCardCompact, { backgroundColor: C.gold }]}>
              <Text style={styles.rewardCardIconCompact}>⭐</Text>
              <Text style={styles.rewardCardTitleCompact}>{tx('Get Points')}</Text>
            </View>
            <View style={styles.rewardArrowCompact}>
              <Text style={styles.rewardArrowTextCompact}>→</Text>
            </View>
            <View style={[styles.rewardCardCompact, { backgroundColor: C.primary }]}>
              <Text style={styles.rewardCardIconCompact}>💰</Text>
              <Text style={styles.rewardCardTitleCompact}>{tx('Redeem')}</Text>
            </View>
          </View>

          <View style={styles.megaStatsRowCompact}>
            <View style={[styles.megaStatCardCompact, { backgroundColor: '#FEF2F2' }]}>
              <Text style={[styles.megaStatNumCompact, { color: gradient.start }]}>₹5L+</Text>
              <Text style={[styles.megaStatLabelCompact, { color: gradient.start }]}>{tx('Rewards Paid')}</Text>
            </View>
            <View style={[styles.megaStatCardCompact, { backgroundColor: C.primaryLight }]}>
              <Text style={[styles.megaStatNumCompact, { color: C.primary }]}>25K+</Text>
              <Text style={[styles.megaStatLabelCompact, { color: C.primary }]}>{tx('Active Members')}</Text>
            </View>
          </View>

          <View style={styles.powerFeaturesCompact}>
            <View style={[styles.powerFeatureCardCompact, { backgroundColor: '#FEF2F2' }]}>
              <View style={[styles.powerFeatureIconCompact, { backgroundColor: gradient.start }]}>
                <AppIcon name="scan" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.powerFeatureTitleCompact, { color: theme.textPrimary }]}>
                {tx('Scan & Earn')}
              </Text>
            </View>

            <View style={[styles.powerFeatureCardCompact, { backgroundColor: C.goldLight }]}>
              <View style={[styles.powerFeatureIconCompact, { backgroundColor: C.gold }]}>
                <AppIcon name="redeem" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.powerFeatureTitleCompact, { color: theme.textPrimary }]}>
                {tx('Daily Payouts')}
              </Text>
            </View>
          </View>

          <Text style={[styles.trustText, { color: C.gold, marginTop: 12 }]}>
            ✦ {tx('25 Years of Trust & Improvement')} ✦
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: darkMode ? '#0F172A' : '#F8FAFC' }]}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        snapToInterval={screenWidth}
        snapToAlignment="start"
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        bounces={false}
        directionalLockEnabled
        overScrollMode="never"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          withWebSafeNativeDriver({})
        )}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="normal"
        style={styles.slider}
        contentContainerStyle={{ width: screenWidth * totalSlides }}
      >
        {[0, 1, 2, 3].map((i) => (
          <Animated.View
            key={i}
            style={[
              styles.slide,
              { width: screenWidth, backgroundColor: theme.surface },
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <ScrollView
              scrollEnabled={false}
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingTop: insets.top,
                paddingBottom: i === 0 ? profileSlideBottomPad : roleSlideBottomPad,
                flexGrow: 1,
              }}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {i === 0 && <Slide1 />}
              {i === 1 && <Slide2 />}
              {i === 2 && <Slide3 gradient={slideGradients[2]} />}
              {i === 3 && <Slide4 gradient={slideGradients[3]} />}
            </ScrollView>
          </Animated.View>
        ))}
      </Animated.ScrollView>

      {showContinueButton && (
        <View
          style={[
            styles.bottomSection,
            { paddingBottom: insets.bottom + bottomSectionPaddingBottom },
          ]}
        >
          <View style={styles.buttonRow}>
            <Pressable
              style={styles.backBtn}
              onPress={snapBackToChooseProfile}
              testID="get-started-back"
              accessible
              accessibilityRole="button"
              accessibilityLabel="Go back"
              android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
            >
              <View style={[styles.backBtnContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <AppIcon name="chevronLeft" size={22} color={theme.textPrimary} strokeWidth={2.2} />
                <Text style={[styles.backBtnText, { color: theme.textPrimary }]}>{tx('Back')}</Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.nextBtn}
              onPress={handleContinue}
              testID="get-started-continue"
              accessible
              accessibilityRole="button"
              accessibilityLabel="Get started continue"
            >
              <View style={[styles.nextBtnGradient, { backgroundColor: currentIndex >= 1 ? currentGradient.start : slideGradients[1].start }]}>
                {slideGradients.slice(1).map((gradient, idx) => {
                  const i = idx + 1;
                  return (
                  <Animated.View
                    key={`next-gradient-${i}`}
                    style={[
                      styles.nextBtnGradientLayer,
                      {
                        opacity: scrollX.interpolate({
                          inputRange: [(i - 1) * screenWidth, i * screenWidth, (i + 1) * screenWidth],
                          outputRange: [0, 1, 0],
                          extrapolate: 'clamp',
                        }),
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={[gradient.start, gradient.end]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.nextBtnGradientFill}
                    />
                  </Animated.View>
                  );
                })}
                <View style={styles.nextBtnContent}>
                  <Text style={styles.nextBtnText}>{tx('Continue')}</Text>
                  <AppIcon name="chevronRight" size={22} color="#fff" />
                </View>
              </View>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slider: { flex: 1 },
  slide: { flex: 1 },
  // New modern styles for redesigned slides
  modernBadge: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  modernBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 4,
  },
  heroTitleAccent: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  // Compact versions for better fit
  heroTitleCompact: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 2,
  },
  heroTitleAccentCompact: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 8,
  },
  heroSubtitleCompact: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  dealerChannelCard: {
    marginBottom: 6,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
    ...createShadow({ color: '#5B21B6', offsetY: 2, blur: 8, opacity: 0.08, elevation: 3 }),
    position: 'relative',
  },
  dealerChannelCardCompact: {
    marginBottom: 5,
    borderRadius: 12,
  },
  dealerChannelCardSheen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    opacity: 0.35,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  dealerChannelCardRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 1,
    position: 'relative',
    zIndex: 1,
  },
  dealerChannelAccentRailWrap: {
    width: 4,
    alignSelf: 'stretch',
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    overflow: 'hidden',
  },
  dealerChannelAccentRailGrad: {
    flex: 1,
    minHeight: 1,
    width: '100%',
  },
  dealerChannelCopyCol: {
    flex: 1,
    paddingVertical: 7,
    paddingRight: 10,
    paddingLeft: 8,
    alignItems: 'center',
  },
  dealerChannelCopyColCompact: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  dealerChannelIconRow: {
    marginBottom: 3,
  },
  dealerChannelIconRowCompact: {
    marginBottom: 2,
  },
  dealerChannelIconGlow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: '#5B21B6', offsetY: 2, blur: 6, opacity: 0.18, elevation: 3 }),
  },
  dealerChannelIconGlowCompact: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  dealerChannelEyebrow: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 3,
  },
  dealerChannelEyebrowCompact: {
    fontSize: 7,
    letterSpacing: 1.3,
    marginBottom: 2,
  },
  dealerChannelHeadline: {
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 4,
    letterSpacing: -0.25,
    paddingHorizontal: 2,
  },
  dealerChannelHeadlineCompact: {
    fontSize: 13,
    lineHeight: 17,
    marginBottom: 3,
  },
  dealerMsgDividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 240,
    marginBottom: 4,
    gap: 6,
    paddingHorizontal: 2,
  },
  dealerMsgDividerWrapCompact: {
    maxWidth: 200,
    marginBottom: 3,
    gap: 5,
  },
  dealerMsgDividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth || 1,
    opacity: 0.85,
  },
  dealerMsgDividerGem: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.85,
    marginTop: 1,
  },
  dealerChannelBody: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
    paddingHorizontal: 0,
    letterSpacing: 0.1,
  },
  dealerChannelBodyCompact: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.06,
  },
  // User slide hero section
  userHeroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  userHeroCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: '#7C3AED', offsetY: 4, blur: 20, opacity: 0.3, elevation: 8 }),
  },
  // Dealer slide hero section
  dealerHeroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dealerHeroCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: '#2563EB', offsetY: 4, blur: 20, opacity: 0.3, elevation: 8 }),
  },
  // Electrician slide hero section
  electricianHeroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  electricianHeroCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: '#059669', offsetY: 4, blur: 20, opacity: 0.3, elevation: 8 }),
  },
  // Floating badges
  floatingBadge1: {
    position: 'absolute',
    top: 30,
    left: 40,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: '#000', offsetY: 2, blur: 8, opacity: 0.15, elevation: 4 }),
  },
  floatingBadge2: {
    position: 'absolute',
    top: 40,
    right: 50,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: '#000', offsetY: 2, blur: 8, opacity: 0.15, elevation: 4 }),
  },
  floatingBadge3: {
    position: 'absolute',
    bottom: 35,
    right: 35,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: '#000', offsetY: 2, blur: 8, opacity: 0.15, elevation: 4 }),
  },
  floatingEmoji: {
    fontSize: 20,
  },
  // Benefit grid (User slide)
  benefitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  benefitCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 140,
  },
  benefitIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  benefitIconText: {
    fontSize: 22,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  benefitDesc: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  // Compact benefit grid
  benefitGridCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  benefitCardCompact: {
    width: '48%',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    minHeight: 100,
  },
  benefitIconBoxCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  benefitIconTextCompact: {
    fontSize: 18,
  },
  benefitTitleCompact: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  // Mega stats row (Dealer & Electrician slides)
  megaStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  megaStatCard: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  megaStatNum: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },
  megaStatLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Compact mega stats
  megaStatsRowCompact: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  megaStatCardCompact: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  megaStatCardDealerTriple: {
    paddingVertical: 12,
    paddingHorizontal: 6,
    minWidth: 0,
  },
  megaStatNumTriple: {
    fontSize: 18,
  },
  megaStatNumCompact: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  megaStatLabelCompact: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  // Power features (Dealer & Electrician slides)
  powerFeatures: {
    gap: 12,
    marginBottom: 20,
  },
  powerFeatureCard: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  powerFeatureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  powerFeatureTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  powerFeatureDesc: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  // Compact power features
  powerFeaturesCompact: {
    gap: 8,
    marginBottom: 14,
  },
  powerFeatureCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    gap: 12,
  },
  powerFeatureIconCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerFeatureTitleCompact: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  // Reward showcase (Electrician slide)
  rewardShowcase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  rewardCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    minHeight: 100,
  },
  rewardCardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  rewardCardTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
    textAlign: 'center',
  },
  rewardCardDesc: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
    opacity: 0.9,
    textAlign: 'center',
  },
  rewardArrow: {
    paddingHorizontal: 4,
  },
  rewardArrowText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '700',
  },
  // Compact reward showcase
  rewardShowcaseCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  rewardCardCompact: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 70,
  },
  rewardCardIconCompact: {
    fontSize: 22,
    marginBottom: 4,
  },
  rewardCardIconWrapCompact: {
    marginBottom: 4,
    minHeight: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardCardTitleCompact: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  rewardArrowCompact: {
    paddingHorizontal: 3,
  },
  rewardArrowTextCompact: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '700',
  },
  // Highlight box
  highlightBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
  },
  highlightText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  // Compact highlight box
  highlightBoxCompact: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    width: '100%',
  },
  highlightTextCompact: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
    width: '100%',
    textAlign: 'center',
  },
  userBannerHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF2FF',
  },
  userHeroBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfoCard: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: '#EFF6FF',
    gap: 6,
  },
  userInfoTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  userInfoText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    ...createShadow({ color: '#000', offsetY: 6, blur: 16, opacity: 0.1, elevation: 6 }),
    position: 'relative',
  },
  cardSheen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 110,
    backgroundColor: '#FFFFFF',
    opacity: 0.12,
    transform: [{ skewX: '-14deg' }],
  },
  cardHeader: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardLogo: { width: 170, height: 75 },
  logoGlow: {
    ...createShadow({ color: '#fff', offsetY: 0, blur: 20, opacity: 0.5, elevation: 10 }),
  },
  // Dot sparkle positions
  sparkleTopLeft: { top: 15, left: 30 },
  sparkleTopRight: { top: 20, right: 35 },
  sparkleBottomLeft: { bottom: 25, left: 40 },
  sparkleBottomRight: { bottom: 20, right: 45 },
  sparkleLeft: { left: 15, top: 70 },
  sparkleRight: { right: 20, top: 63 },
  sparkleTop: { top: 8, left: '50%' as any },
  sparkleBottom: { bottom: 8, left: '50%' as any },
  // Star sparkle positions
  starText: { fontSize: 14 },
  starTopLeft: { top: 25, left: 55 },
  starTopRight: { top: 30, right: 55 },
  starBottomLeft: { bottom: 35, left: 60 },
  starBottomRight: { bottom: 30, right: 60 },
  // Header (slides 2 & 3)
  headerContent: { alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleHeroWrap: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  roleHeroImage: {
    width: 92,
    height: 92,
  },
  bannerHeader: {
    height: 140,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  headerBannerImage: {
    width: '100%',
    height: '100%',
  },
  headerBannerImageCompact: {
    width: '100%',
    height: '100%',
  },
  // expo-image uses `contentPosition: top`; extra crop consumes bottom of bitmap first.
  electricianBannerImageFill: StyleSheet.absoluteFillObject,
  roleHeroImageCompact: {
    width: 82,
    height: 82,
  },
  dealerHeroImage: {
    width: 102,
    height: 102,
  },
  dealerHeroImageCompact: {
    width: 92,
    height: 92,
  },
  roleBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Card body
  cardBody: { padding: 24, paddingTop: 12 },
  cardBodyCompact: { padding: 18, paddingTop: 10 },
  // Slide 1 content styles
  tricolorWrapper: { marginBottom: 14 },
  tricolorContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  tricolorBar: { flex: 1, height: '100%' },
  welcomeText: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 1,
  },
  sinceText: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.4,
  },
  statsHighlightRow: { flexDirection: 'row', gap: 8, marginBottom: 10, marginTop: 6 },
  statsHighlightCard: { flex: 1, padding: 9, borderRadius: 12, alignItems: 'center' },
  statsHighlightCardSmall: { flex: 0.7 },
  statsHighlightNum: { fontSize: 17, fontWeight: '900', marginBottom: 1 },
  statsHighlightLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  productsSection: {
    width: '100%',
    marginBottom: 14,
    marginTop: 4,
  },
  // Slides 2 & 3 content styles
  chipBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: 16,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
    lineHeight: 32,
    textAlign: 'center',
  },
  slideSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  redirectNote: {
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  redirectText: {
    fontSize: 13,
    fontWeight: '700',
  },
  centeredChip: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
    lineHeight: 26,
    textAlign: 'center',
  },
  cardTitleCompact: {
    fontSize: 18,
    lineHeight: 22,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
    textAlign: 'center',
  },
  cardDescCompact: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statsRowCompact: { gap: 6, marginBottom: 10 },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  statNum: { fontSize: 16, fontWeight: '900', textAlign: 'center' },
  statNumCompact: { fontSize: 14 },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
    textAlign: 'center',
  },
  // Shared feature styles
  features: { gap: 8, marginBottom: 12 },
  featuresCompact: { gap: 6, marginBottom: 10 },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    minHeight: 64,
    borderRadius: 14,
  },
  featureItemCompact: {
    gap: 10,
    padding: 10,
    minHeight: 56,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconCompact: {
    width: 34,
    height: 34,
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: '800' },
  featureTitleCompact: { fontSize: 13 },
  featureSub: { fontSize: 11, marginTop: 2 },
  featureSubCompact: { fontSize: 10, marginTop: 1 },
  // Pills
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  roleSelectorWrap: {
    marginTop: 24,
    marginBottom: 14,
    gap: 10,
  },
  roleSelectorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleSelectorTitleLine: {
    flex: 1,
    height: 1.5,
    borderRadius: 1,
    opacity: 0.25,
  },
  roleSelectorTitle: {
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  roleSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleSelectorChip: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8E2F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  roleSelectorChipActive: {
    borderColor: '#E8453C',
    backgroundColor: '#FFF1EF',
  },
  roleSelectorChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
  },
  roleSelectorChipTextActive: {
    color: '#E8453C',
  },
  roleCard: {
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
    aspectRatio: 0.85,
    width: '100%',
  },
  roleCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  roleCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 7,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 1,
  },
  roleCardLabelWrap: {
    alignItems: 'center',
    paddingTop: 8,
    gap: 4,
  },
  roleCardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  roleCardLabel: {
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  roleCardSub: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  roleCardCheck: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCardCheckText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  rolePills: {
    marginTop: 'auto',
    marginBottom: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  pillText: { fontSize: 10, fontWeight: '700' },
  // Bottom navigation
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  backBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  backBtnContent: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 2,
    borderRadius: 14,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  nextBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    ...createShadow({ color: '#000', offsetY: 3, blur: 6, opacity: 0.12, elevation: 3 }),
  },
  nextBtnGradient: {
    height: 54,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 14,
  },
  nextBtnGradientLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    overflow: 'hidden',
  },
  nextBtnGradientFill: {
    flex: 1,
    borderRadius: 14,
  },
  nextBtnContent: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
