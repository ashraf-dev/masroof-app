import { Redirect } from 'expo-router';

/** OAuth redirect target; the session itself is exchanged in lib/auth.ts. */
export default function AuthCallback() {
  return <Redirect href="/" />;
}
