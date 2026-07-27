import { Stack } from 'expo-router';

// Ticket status tabs live here (Upcoming / Completed / Cancelled).
// Swap this Stack for a Material Top Tabs navigator once each screen has content.
export default function TicketsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
