"use client";

type PostViewType = "study" | "free";

type PostViewEntry = {
  id: string;
  type: PostViewType;
  createdAt: number;
};

const STORAGE_KEY = "hp_post_view_refs";
const TTL_MS = 1000 * 60 * 60 * 24 * 7;

function readStore() {
  if (typeof window === "undefined") return {} as Record<string, PostViewEntry>;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, PostViewEntry>;
    const now = Date.now();
    const cleaned = Object.fromEntries(
      Object.entries(parsed).filter(([, entry]) => now - entry.createdAt < TTL_MS),
    );

    if (Object.keys(cleaned).length !== Object.keys(parsed).length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }

    return cleaned;
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, PostViewEntry>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function createPostViewRef(type: PostViewType, id: string) {
  const ref =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${type}-${id}-${Date.now()}`;

  const store = readStore();
  store[ref] = {
    id,
    type,
    createdAt: Date.now(),
  };
  writeStore(store);

  return ref;
}

export function resolvePostViewRef(type: PostViewType, ref: string | null) {
  if (!ref) return "";

  const store = readStore();
  const entry = store[ref];
  if (!entry || entry.type !== type) return "";
  return entry.id;
}
