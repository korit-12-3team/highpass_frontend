import { TodoItem } from "@/shared/context/AppContext";

const TODO_ORDER_STORAGE_PREFIX = "hp_todo_order_";

function getTodoOrderStorageKey(userId: string) {
  return `${TODO_ORDER_STORAGE_PREFIX}${userId}`;
}

export function readTodoOrder(userId: string): Record<string, number[]> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(getTodoOrderStorageKey(userId));
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).map(([dateKey, ids]) => [
        dateKey,
        Array.isArray(ids) ? ids.map((id) => Number(id)).filter(Number.isFinite) : [],
      ]),
    );
  } catch {
    return {};
  }
}

export function writeTodoOrder(userId: string, orderMap: Record<string, number[]>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getTodoOrderStorageKey(userId), JSON.stringify(orderMap));
}

export function sortTodosByStoredOrder(items: TodoItem[], orderedIds: number[]) {
  if (orderedIds.length === 0) return items;

  const orderedIndex = new Map(orderedIds.map((id, index) => [id, index]));
  return [...items].sort((a, b) => {
    const left = orderedIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const right = orderedIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return left - right;
  });
}

export function reorderTodos(items: TodoItem[], sourceId: number, targetId: number) {
  const sourceIndex = items.findIndex((todo) => todo.id === sourceId);
  const targetIndex = items.findIndex((todo) => todo.id === targetId);

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}
