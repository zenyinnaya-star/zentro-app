// @ts-nocheck
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  Dimensions,
  Pressable,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);// this a just to aviod the ts error it crashes  when i am using  the animated flat list

// Screen 03 — Onboarding carousel

const PHOTO_GRID = require('../../assets/images/onboarding/photo-grid.png');

const SLIDES = [//
  {
    key: '1',
    title: 'Discover Events Near You',
    subtitle: 'Browse concerts, workshops, and meetups happening around you.',
  },
  {
    key: '2',
    title: 'Book in Seconds',
    subtitle: 'Reserve your spot and get your ticket instantly, no hassle.',
  },
  {
    key: '3',
    title: 'Find your nearby\nevent here',
    subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  },
];

export default function OnboardingCarousel() {
  const router = useRouter();
  const listRef = useRef<FlatList<any> | null>(null);
  const scrollX = useRef(new Animated.Value(0) as Animated.Value<number>).current;
  const [activeIndex, setActiveIndex] = useState(0);

  const isLastSlide = activeIndex === SLIDES.length - 1;

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {// this is function is only called when the user scrolls the carousel, not when

    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== activeIndex) setActiveIndex(index);
  }

  function goNext() {// Scroll to the next slide or route to signup if on the last slide
    if (isLastSlide) {
      router.replace('/(auth)/signup');
      return;
    }
    listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
  }

  function skip() {// Skip to the last slide and then route to signup
    router.replace('/(auth)/signup');
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Pressable style={styles.skipButton} onPress={skip} hitSlop={12}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <AnimatedFlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false, listener: handleScroll }
        )}
        scrollEventThrottle={16}
        renderItem={({ item }: { item: typeof SLIDES[number] }) => (
          <View style={styles.slide}>
            <Image source={PHOTO_GRID} style={styles.artImage} resizeMode="cover" />
            <View style={styles.textBlock}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]}
              />
            );
          })}
        </View>

        <Pressable style={styles.nextButton} onPress={goNext}>
          <Text style={styles.nextButtonText}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const BRAND = {
  background: '#FFFFFF',
  accent: '#FF383C',
  textPrimary: '#25131A',
  textMuted: '#8B8688',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.background,
  },
  skipButton: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  slide: {
    width,
    alignItems: 'center',
  },
  artImage: {
    width,
    height: width * 1.19,
  },
  textBlock: {
    paddingHorizontal: 32,
    marginTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: BRAND.textPrimary,
    textAlign: 'center',
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 15,
    color: BRAND.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.accent,
  },
  nextButton: {
    width: '100%',
    backgroundColor: BRAND.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
