import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';
import { TABLES, useAppStore } from './store';
import type { Profile, TableName } from './types';

const PAGE = 1000;
const LOCAL_ONLY = ['updated_at'] as const;

let running: Promise<void> | null = null;
let queued = false;

/** Push local changes, then pull everything changed on the server since the last cursor. */
export function syncNow(): Promise<void> {
  if (running) {
    queued = true;
    return running;
  }
  running = (async () => {
    try {
      const net = await NetInfo.fetch();
      if (net.isConnected === false) return;
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      await push();
      await pull();
      useAppStore.getState().setLastSync(new Date().toISOString());
    } catch (e) {
      console.warn('sync failed', e);
    } finally {
      running = null;
      if (queued) {
        queued = false;
        syncNow();
      }
    }
  })();
  return running;
}

let timer: ReturnType<typeof setTimeout> | null = null;
export function scheduleSync(delay = 1500) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    syncNow();
  }, delay);
}

function stripLocal<T extends object>(row: T) {
  const copy = { ...row } as Record<string, unknown>;
  for (const k of LOCAL_ONLY) delete copy[k];
  return copy;
}

async function push() {
  const state = useAppStore.getState();

  if (state.profileDirty && state.profile) {
    const rev = state.profileDirty;
    const { id, ...fields } = stripLocal(state.profile) as unknown as Profile;
    const { error } = await supabase.from('profiles').upsert({ id, ...fields });
    if (error) throw error;
    useAppStore.getState().markProfilePushed(rev);
  }

  // Parents before children so foreign keys resolve.
  for (const table of TABLES) {
    const { dirty, rows } = useAppStore.getState();
    const revs = { ...dirty[table] };
    const ids = Object.keys(revs);
    if (!ids.length) continue;
    const payload = ids.map((id) => rows[table][id]).filter(Boolean).map(stripLocal);
    for (let i = 0; i < payload.length; i += PAGE) {
      const chunk = payload.slice(i, i + PAGE);
      const { error } =
        table === 'salary_entries'
          ? await supabase.from(table).upsert(chunk, { onConflict: 'user_id,month' })
          : await supabase.from(table).upsert(chunk);
      if (error) throw error;
    }
    useAppStore.getState().markPushed(table, revs);
  }
}

async function pull() {
  const { userId } = useAppStore.getState();
  if (!userId) return;

  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  if (profile) useAppStore.getState().applyPulledProfile(profile as Profile);

  for (const table of TABLES) await pullTable(table);
}

async function pullTable(table: TableName) {
  for (;;) {
    const cursor = useAppStore.getState().cursors[table];
    let q = supabase.from(table).select('*').order('updated_at', { ascending: true }).limit(PAGE);
    if (cursor) q = q.gt('updated_at', cursor);
    const { data, error } = await q;
    if (error) throw error;
    if (!data?.length) return;
    useAppStore.getState().applyPulled(table, data as never[], data[data.length - 1].updated_at);
    if (data.length < PAGE) return;
  }
}

/** Starts background sync triggers. Returns an unsubscribe function. */
export function startSyncListeners() {
  let wasConnected = true;
  const unsubNet = NetInfo.addEventListener((s) => {
    const connected = s.isConnected !== false;
    if (connected && !wasConnected) syncNow();
    wasConnected = connected;
  });
  const unsubStore = useAppStore.subscribe((s, prev) => {
    if (s.dirty !== prev.dirty || s.profileDirty !== prev.profileDirty) {
      if (s.profileDirty || TABLES.some((t) => Object.keys(s.dirty[t]).length)) scheduleSync();
    }
  });
  return () => {
    unsubNet();
    unsubStore();
  };
}
