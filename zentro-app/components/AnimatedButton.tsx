import { useRef } from 'react';
import { Animated, Text, Pressable, StyleSheet, GestureResponderEvent } from 'react-native';

type Props = {
  label: string;
  variant?: 'solid' | 'outline';
  onPress?: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  flex?: number;
};

export default function AnimatedButton({ label, variant = 'outline', onPress, disabled, flex = 1 }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();

  return (
    <Animated.View style={{ flex, transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        style={[styles.base, variant === 'solid' ? styles.solid : styles.outline, disabled && styles.disabled]}
      >
        <Text
          style={[
            styles.text,
            variant === 'solid' ? styles.textSolid : styles.textOutline,
            disabled && styles.textDisabled,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const BRAND = { accent: '#FF3D8F', border: '#E7E3EB', textPrimary: '#1A1523', textMuted: '#B5B0BC' };

const styles = StyleSheet.create({
  base: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  solid: { backgroundColor: BRAND.accent },
  outline: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: BRAND.border },
  disabled: { backgroundColor: '#F3F1F5' },
  text: { fontSize: 13, fontWeight: '700' },
  textSolid: { color: '#fff' },
  textOutline: { color: BRAND.textPrimary },
  textDisabled: { color: BRAND.textMuted },
});
