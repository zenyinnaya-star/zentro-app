// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

// Screen 01 — Splash

const LETTERS = ['Z', 'E', 'N', 'T', 'R', 'O'];// i created a const array of the app name to be read through and animated letter by letter

export default function Splash() {
  const router = useRouter();
  type LetterAnim = { opacity: Animated.Value; scale: Animated.Value };
  const letterAnims = useRef<LetterAnim[]>(
    LETTERS.map(() => ({// this reads through the LETTERS array and creates an array of objects for each letter, each containing an opacity and scale animated value  
      opacity: new Animated.Value(0),// this is a react native animated value that starts at 0 and will be animated to 1 to make the letter visible
      scale: new Animated.Value(3),// this is a react native animated value that starts at 3 and will be animated to 1 to make the letter scale down to its normal size
    }))
  ).current;

  const flashOpacity = useRef(new Animated.Value(0)).current;// this a react native  animated value 
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {// this my react hook that only runs once when the cponet has began to mount, it will run  the animation sequce of zentro letters and flash and glow
    let isMounted = true;
    // Kick off the session check alongside the animation so there's no extra
    // wait once the animation lands.
    const sessionPromise = supabase.auth.getSession();

    const letterAnimations = letterAnims.map(({ opacity, scale }: LetterAnim) =>
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 60,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.sequence([
      // Letters zoom in one after another
      Animated.stagger(90, letterAnimations),
      // Flash glow sweeps across once all letters have landed
      Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      const { data } = await sessionPromise;
      if (!isMounted) return;
      router.replace(data.session ? '/(tabs)/home' : '/(onboarding)/carousel');
    });

    return () => {
      isMounted = false;
    };
  }, [letterAnims, flashOpacity, taglineOpacity, router]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.center}>
        <View style={styles.wordmark}>
          {LETTERS.map((letter, i) => (
            <Animated.Text
              key={`${letter}-${i}`}
              style={[
                styles.logoText,
                {
                  opacity: letterAnims[i].opacity,
                  transform: [{ scale: letterAnims[i].scale }],
                },
              ]}
            >
              {letter}
            </Animated.Text>
          ))}

          {/* Flash glow overlay, synced to land right after the last letter */}
          <Animated.View
            pointerEvents="none"
            style={[styles.flash, { opacity: flashOpacity }]}
          />
        </View>

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Discover. Book. Experience.
        </Animated.Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotMuted]} />
        <View style={[styles.dot, styles.dotMuted]} />
      </View>
    </View>
  );
}

const BRAND = {
  background: '#14121F',
  accent: '#FF6B4A',
  textPrimary: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.background,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    flexDirection: 'row',
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 6,
    color: BRAND.textPrimary,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BRAND.accent,
    borderRadius: 8,
    shadowColor: BRAND.accent,
    shadowOpacity: 0.9,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  tagline: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
    color: BRAND.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginBottom: 56,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND.accent,
  },
  dotMuted: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});