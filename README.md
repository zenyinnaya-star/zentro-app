Zentro App



Zentro is a mobile event \& ticketing app built with Expo and React Native. Users can discover events, view them on a map, book tickets, leave reviews, form party groups, and manage their profile and tickets — all backed by Supabase.



Features

Onboarding \& Auth — carousel intro, sign up, log in, profile selection, username creation

Home \& Search — browse events, search, view on an interactive map

Event Details — view event info, book tickets, see order details

Tickets — view upcoming, completed, and cancelled tickets with QR codes; cancel a booking

Favorites — save and view favorite events

Reviews — write a review for an event

Party Group — plan events with a group of friends

Notifications — view app notifications

Profile — view and edit your profile

Tech Stack

Expo (SDK 54) + Expo Router for navigation

React Native 0.81 / React 19

TypeScript

Supabase for auth \& database (see lib/supabase.ts and supabase/migrations)

react-native-maps for the map view

react-native-qrcode-svg for ticket QR codes

Project Structure

zentro-app/

├── app/                  # Screens (Expo Router file-based routing)

│   ├── (auth)/           # Login, sign up, select profile, create username

│   ├── (onboarding)/     # Onboarding carousel, select favorites

│   ├── (tabs)/           # Home, search, map, favorites, tickets, profile

│   ├── event/            # Event detail screen

│   ├── booking/          # Cancel booking flow

│   ├── order/             # Order detail screen

│   ├── review/            # Write a review screen

│   ├── ticket/            # Ticket detail \& booked confirmation

│   ├── party-group/       # Party group screen

│   ├── notifications/     # Notifications screen

│   └── profile/           # Edit profile screen

├── components/            # Shared UI components (TicketCard, AnimatedButton, TicketsTabBar)

├── lib/supabase.ts        # Supabase client setup

├── supabase/migrations/   # Database schema migrations

├── assets/                # App icons, splash screens

└── Asset/                 # Design reference screenshots

Getting Started

Prerequisites

Node.js and npm

Expo CLI (npx expo works without a global install)

A Supabase project

Setup

Clone the repo and install dependencies:

bash

&#x20;  git clone https://github.com/zenyinnaya-star/zentro-app.git

&#x20;  cd zentro-app/zentro-app

&#x20;  npm install

Copy .env.example to .env and fill in your Supabase project values:

bash

&#x20;  cp .env.example .env

&#x20;  EXPO\_PUBLIC\_SUPABASE\_URL=https://your-project-ref.supabase.co

&#x20;  EXPO\_PUBLIC\_SUPABASE\_ANON\_KEY=your-anon-public-key

Run the app:

bash

&#x20;  npm start        # Expo dev server (scan QR with Expo Go)

&#x20;  npm run android  # Android emulator/device

&#x20;  npm run ios      # iOS simulator/device

&#x20;  npm run web      # Web browser

Roadmap

&#x20;Improve the Notifications screen

&#x20;Add Dark / Light mode toggle to the Profile screen

License



See LICENSE for details.

