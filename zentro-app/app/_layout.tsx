import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ThemeProvider } from '../context/ThemeContext';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) {
    // TODO: replace with the Splash screen (app/index.tsx handles this route already;
    // this guard just covers the brief moment while Supabase restores the session).
    return null;
  }

  return (
    <ThemeProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        {session ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <>
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(auth)" />
          </>
        )}
        <Stack.Screen name="event/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="order/[eventId]" options={{ headerShown: false }} />
        <Stack.Screen
          name="ticket/booked"
          options={{ headerShown: false, presentation: 'transparentModal', animation: 'fade' }}
        />
        <Stack.Screen name="ticket/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="review/[id]" options={{ headerShown: true, title: 'Write a Review' }} />
        <Stack.Screen name="booking/cancel/[id]" options={{ headerShown: true, title: 'Cancel Booking' }} />
        <Stack.Screen name="party-group/index" options={{ headerShown: true, title: 'Party Group' }} />
        <Stack.Screen name="profile/edit" options={{ headerShown: true, title: 'Edit Profile' }} />
        <Stack.Screen name="notifications/index" options={{ headerShown: true, title: 'Notifications' }} />
      </Stack>
    </ThemeProvider>
  );
}
