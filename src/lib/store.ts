import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as Crypto from 'expo-crypto';
import { debouncedStorage } from './secureStorage';
import type { Lang, Profile, TableName, TableRows } from './types';

export const TABLES: TableName[] = ['categories', 'recurring_expenses', 'expenses', 'salary_entries'];

type Rows = { [T in TableName]: Record<string, TableRows[T]> };
/** id → local revision; a row stays dirty until a push of that exact revision succeeds. */
type Dirty = { [T in TableName]: Record<string, number> };
type Cursors = { [T in TableName | 'profiles']: string | null };

const emptyRows = (): Rows => ({ categories: {}, recurring_expenses: {}, expenses: {}, salary_entries: {} });
const emptyDirty = (): Dirty => ({ categories: {}, recurring_expenses: {}, expenses: {}, salary_entries: {} });
const emptyCursors = (): Cursors => ({ profiles: null, categories: null, recurring_expenses: null, expenses: null, salary_entries: null });

export interface AppState {
  hydrated: boolean;
  userId: string | null;
  profile: Profile | null;
  profileDirty: number;
  /** Language chosen before signing in (no profile yet). */
  preferredLanguage: Lang | null;
  rows: Rows;
  dirty: Dirty;
  cursors: Cursors;
  lastSyncAt: string | null;
  lockEnabled: boolean;
  biometricEnabled: boolean;

  setUser: (userId: string | null) => void;
  setPreferredLanguage: (lang: Lang) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  upsert: <T extends TableName>(table: T, row: Omit<TableRows[T], 'id' | 'user_id' | 'created_at' | 'deleted_at'> & Partial<Pick<TableRows[T], 'id' | 'created_at' | 'deleted_at'>>) => TableRows[T];
  remove: (table: TableName, id: string) => void;
  applyPulled: <T extends TableName>(table: T, rows: TableRows[T][], cursor: string | null) => void;
  applyPulledProfile: (profile: Profile) => void;
  markPushed: (table: TableName, revs: Record<string, number>) => void;
  markProfilePushed: (rev: number) => void;
  setLastSync: (iso: string) => void;
  setLock: (patch: { lockEnabled?: boolean; biometricEnabled?: boolean }) => void;
}

let rev = Date.now();
const nextRev = () => ++rev;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      userId: null,
      profile: null,
      profileDirty: 0,
      preferredLanguage: null,
      rows: emptyRows(),
      dirty: emptyDirty(),
      cursors: emptyCursors(),
      lastSyncAt: null,
      lockEnabled: false,
      biometricEnabled: false,

      setUser: (userId) => {
        if (userId === get().userId) return;
        // Different account (or sign-out): never mix data between users.
        set({
          userId,
          profile: null,
          profileDirty: 0,
          rows: emptyRows(),
          dirty: emptyDirty(),
          cursors: emptyCursors(),
          lastSyncAt: null,
        });
      },

      setPreferredLanguage: (lang) => set({ preferredLanguage: lang }),

      updateProfile: (patch) => {
        const { profile, userId } = get();
        if (!userId) return;
        const base: Profile = profile ?? {
          id: userId,
          display_name: null,
          monthly_salary: null,
          salary_day: null,
          currency: 'EGP',
          language: get().preferredLanguage ?? 'ar',
          weekly_summary_day: 5,
          notification_hour: 20,
          onboarded: false,
        };
        set({ profile: { ...base, ...patch }, profileDirty: nextRev() });
      },

      upsert: (table, input) => {
        const { userId, rows, dirty } = get();
        const existing = input.id ? rows[table][input.id] : undefined;
        const row = {
          ...existing,
          ...input,
          id: input.id ?? Crypto.randomUUID(),
          user_id: userId!,
          created_at: existing?.created_at ?? input.created_at ?? new Date().toISOString(),
          deleted_at: input.deleted_at ?? existing?.deleted_at ?? null,
        } as unknown as TableRows[typeof table];
        set({
          rows: { ...rows, [table]: { ...rows[table], [row.id]: row } },
          dirty: { ...dirty, [table]: { ...dirty[table], [row.id]: nextRev() } },
        });
        return row;
      },

      remove: (table, id) => {
        const { rows, dirty } = get();
        const existing = rows[table][id];
        if (!existing) return;
        set({
          rows: { ...rows, [table]: { ...rows[table], [id]: { ...existing, deleted_at: new Date().toISOString() } } },
          dirty: { ...dirty, [table]: { ...dirty[table], [id]: nextRev() } },
        });
      },

      applyPulled: (table, pulled, cursor) => {
        const { rows, dirty, cursors } = get();
        const next = { ...rows[table] } as Record<string, TableRows[typeof table]>;
        for (const r of pulled) {
          // Local unsynced edits win; they'll be pushed on the next sync.
          if (dirty[table][r.id]) continue;
          // Postgres numeric arrives as a string.
          next[r.id] = 'amount' in r ? { ...r, amount: Number(r.amount) } : r;
        }
        set({ rows: { ...rows, [table]: next }, cursors: { ...cursors, [table]: cursor ?? cursors[table] } });
      },

      applyPulledProfile: (profile) => {
        if (get().profileDirty) return;
        set({
          profile: { ...profile, monthly_salary: profile.monthly_salary == null ? null : Number(profile.monthly_salary) },
          cursors: { ...get().cursors, profiles: profile.updated_at ?? null },
        });
      },

      markPushed: (table, revs) => {
        const current = { ...get().dirty[table] };
        for (const [id, r] of Object.entries(revs)) if (current[id] === r) delete current[id];
        set({ dirty: { ...get().dirty, [table]: current } });
      },

      markProfilePushed: (r) => {
        if (get().profileDirty === r) set({ profileDirty: 0 });
      },

      setLastSync: (iso) => set({ lastSyncAt: iso }),
      setLock: (patch) => set(patch),
    }),
    {
      name: 'masroofy-store-v1',
      storage: createJSONStorage(() => debouncedStorage()),
      partialize: ({ hydrated, ...rest }) => rest,
      onRehydrateStorage: () => () => useAppStore.setState({ hydrated: true }),
    },
  ),
);

export function hasPendingChanges(s: AppState = useAppStore.getState()) {
  return !!s.profileDirty || TABLES.some((t) => Object.keys(s.dirty[t]).length > 0);
}
