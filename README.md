# مصاريفي (Masroofy)

تطبيق موبايل (Android و iOS) لتسجيل المصروفات وتصنيفها، مع ملخص أسبوعي ومقارنة الصرف بالمرتب.
Built from `PRD_masrofy.md` — this repo covers the MVP (section 3) and the non-functional requirements (section 4).

## Stack

- **App:** Expo SDK 54 · React Native 0.81 · TypeScript · Expo Router
- **Backend:** Supabase (Postgres + Auth + Edge Functions), project `vfpbvnvyekfroxdhtysl`
- **State / offline:** Zustand store persisted to AES-256–encrypted storage (key in Keychain / Android Keystore), with an outbox that syncs to Supabase when online

## Features (MVP)

| PRD | Where |
| --- | --- |
| Sign in with email, phone (SMS OTP), Google, Apple | `src/app/(auth)/sign-in.tsx`, `src/lib/auth.ts` |
| Onboarding: salary, payday, currency (EGP default) | `src/app/onboarding.tsx` |
| Monthly "نزل مرتبك؟" prompt on payday + edit anytime | `src/lib/notifications.ts`, `src/app/salary.tsx` |
| Add expense in < 5 s (amount → category → save), edit, delete | `src/app/expense/[id].tsx` |
| Recurring expenses (weekly / monthly) | `src/app/recurring/*`, `src/lib/recurring.ts` |
| Default categories + custom ones with icon & color | DB trigger, `src/app/categories/*` |
| Weekly summary on a chosen day (default Friday) with notification | `src/app/weekly-summary.tsx` |
| Home: remaining salary this pay cycle, donut + recent | `src/app/(tabs)/index.tsx` |
| Reports: pie by category, bars by day, week/month/category filters | `src/app/(tabs)/reports.tsx`, `expenses.tsx` |
| Settings: currency, language (ar/en), notification day & hour, CSV export, delete account | `src/app/(tabs)/settings.tsx` |
| Offline-first with sync | `src/lib/store.ts`, `src/lib/sync.ts` |
| Encryption at rest + PIN / fingerprint / Face ID lock | `src/lib/secureStorage.ts`, `src/lib/lock.ts`, `src/components/LockScreen.tsx` |
| Full RTL | `src/i18n` (Arabic default; switching language flips layout and reloads) |

## How sync works

- Every row has a client-generated UUID, so records can be created offline.
- Local changes are marked dirty (with a revision number) and pushed as upserts; a row is only cleared once that exact revision is pushed.
- Deletes are soft (`deleted_at`), so they sync like any other change.
- The server sets `updated_at` on every write (trigger), and the client pulls rows with `updated_at > cursor` per table.
- Recurring occurrences use a deterministic id (hash of recurring id + date), so two offline devices can't create duplicates.

## Database

Migrations are in `supabase/migrations` and are already applied to the Supabase project:

- `profiles`, `categories`, `expenses`, `recurring_expenses`, `salary_entries`
- RLS on every table: a user can only read/write their own rows
- `on_auth_user_created` trigger creates the profile and the 8 default categories
- Edge Function `delete-account` (in `supabase/functions`) deletes the auth user; all data cascades

## Run it

```bash
npm install
cp .env.example .env      # Supabase URL + publishable key
npx expo start
```

Biometrics, Apple sign-in and notifications need a development build rather than Expo Go:

```bash
npx eas-cli@latest build --profile development --platform android   # or ios
```

Checks: `npm run typecheck` and `npm run lint`.

## Building on Codemagic

`codemagic.yaml` has three workflows. Connect the repo in Codemagic, then start one from **Start new build**:

| Workflow | Output | Setup needed |
| --- | --- | --- |
| `android-apk` | Installable test APK | None |
| `android-release` | Signed AAB + APK for Google Play | Upload a keystore named `masroofy_keystore` (Team settings → Code signing identities → Android keystores) |
| `ios-release` | IPA uploaded to TestFlight | See "iOS signing" below |

### iOS signing

1. **Apple Developer portal → Identifiers:** register the App ID `com.masroofy.app` and enable **Push Notifications** and **Sign In with Apple**.
2. **App Store Connect → Apps:** create a new app with that bundle id.
3. **App Store Connect → Users and Access → Integrations → App Store Connect API:** create a key with the *App Manager* role. In Codemagic → Team settings → Team integrations → Developer Portal, add it with the name `codemagic`.
4. Generate a certificate private key: `ssh-keygen -t rsa -b 2048 -m PEM -f masroofy_cert_key -q -N ""`.
5. Codemagic → app → Environment variables: add `CERTIFICATE_PRIVATE_KEY` with the contents of `masroofy_cert_key`, marked **Secret**, in the group `ios_credentials`.

The workflow then creates (or reuses) the distribution certificate and App Store provisioning profile on every build.

Each build runs `expo prebuild` to generate the native projects, uses Codemagic's build number as the version code / build number, and runs the typecheck and lint first.

## Supabase dashboard setup still needed

These can't be set from code and must be configured in the Supabase dashboard (Authentication):

1. **URL configuration** → add `masroofy://auth-callback` (and `exp://**` for development) to Redirect URLs.
2. **Providers → Google**: add the Google OAuth client ID/secret.
3. **Providers → Apple**: add the Services ID / key; for native iOS sign-in add the bundle id `com.masroofy.app`.
4. **Providers → Phone**: enable it and connect an SMS provider (Twilio, MessageBird, Vonage…).
5. Optional: turn off "Confirm email" if you want email sign-up without a confirmation step.

## Out of scope for this version

Per the PRD: bank linking, shared accounts, investments. The V1.1+ ideas (budgets per category, widget, dark mode, voice input, OCR, SMS parsing, …) are not implemented yet.
