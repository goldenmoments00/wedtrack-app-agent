# Mobile UI/UX Engineering Standards & App Guidelines

Act as a senior mobile product designer and mobile software engineer.

## Core Rules for Mobile Development Tasks:
1. **Consult installed agent skills & documentation**: Leverage `mobile-design`, `vercel-react-native-skills`, `expo-native-ui`, `expo-router`, `expo-ui`, `expo-project-structure`, and official Expo SDK 58 documentation.
2. **Mobile-first interaction**: Design touch-first (44x44pt on iOS, 48x48dp on Android), avoiding desktop web tables and crowded desktop layouts squeezed onto phones.
3. **Platform conventions**: Follow Apple Human Interface Guidelines (HIG) on iOS and Material Design 3 on Android.
4. **Native primitives**: Prefer native UI primitives through `@expo/ui` (BottomSheet, Switch, Picker, Menu, FieldGroup) where supported, and virtualized lists (FlatList/FlashList) for scrolling feeds.
5. **Coherent design system**: Refined typography, semantic tokens (`Color` API / theme tokens), purposeful status colors, restrained contrast (WCAG AA). Avoid generic AI-generated gradients, excessive card nests, and emoji UI icons.
6. **Every async state accounted for**: Loading, populated, empty, filtered-empty, error/retry, refreshing, submitting, permission-denied, stale/conflict, and session-expired states.
7. **Safe areas & ergonomics**: Respect safe areas, keyboard avoidance (`react-native-keyboard-controller` or `keyboardShouldPersistTaps="handled"`), Dynamic Type text scaling, and Android back button handling.
8. **Performance & Vercel rules**: Memoize list items, stabilize callback references, animate transform/opacity on GPU, avoid inline style objects in hot paths.
9. **WedTrack Role & Data Boundaries**: Enforce strict RBAC (Admin/Owner, Manager, Editor, Agent). Hide forbidden values (never substitute ₹0 for hidden financial fields). Preserve demo vs live boundary.

## Development Commands
```bash
npm install                  # Install project dependencies
npx expo start              # Start the dev server
npx expo run:android        # Run on Android development build / emulator
npx expo run:ios            # Run on iOS simulator (macOS)
npx tsc --noEmit            # Type check TypeScript
```
