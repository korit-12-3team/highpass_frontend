"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TodoItem } from "@/shared/context/AppContext";
import {
  createTodo,
  deleteTodo as deleteTodoApi,
  listTodos,
  toggleTodoStatus,
  updateTodoContent,
} from "@/features/calendar/api/todos";
import { formatDateKey } from "@/features/calendar/utils/calendarLayout";
import {
  readTodoOrder,
  reorderTodos,
  sortTodosByStoredOrder,
  writeTodoOrder,
} from "@/features/calendar/utils/todoOrder";
import { ConfirmDialogState } from "@/features/calendar/types";
import { toUserMessage } from "@/shared/errors";

export function useCalendarTodos({
  currentUser,
  todos,
  setTodos,
  currentYear,
  currentMonth,
  daysInMonth,
  selectedDateKey,
  setConfirmDialog,
}: {
  currentUser: { id: string } | null;
  todos: Record<string, TodoItem[]>;
  setTodos: React.Dispatch<React.SetStateAction<Record<string, TodoItem[]>>>;
  currentYear: number;
  currentMonth: number;
  daysInMonth: number;
  selectedDateKey: string;
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogState>>;
}) {
  const [newTodoText, setNewTodoText] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingTodoText, setEditingTodoText] = useState("");
  const [draggedTodoId, setDraggedTodoId] = useState<number | null>(null);
  const [dropTargetTodoId, setDropTargetTodoId] = useState<number | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;

    void (async () => {
      try {
        const todoItems = await listTodos(currentUser.id);
        if (cancelled) return;

        setTodos((prev) => {
          const next = { ...prev };
          const storedOrder = readTodoOrder(currentUser.id);

          for (let d = 1; d <= daysInMonth; d += 1) {
            next[formatDateKey(currentYear, currentMonth, d)] = [];
          }

          todoItems.forEach((item) => {
            if (!item.createdAt) return;
            const itemDate = new Date(item.createdAt);
            if (Number.isNaN(itemDate.getTime())) return;
            if (itemDate.getFullYear() !== currentYear || itemDate.getMonth() !== currentMonth) return;
            const key = formatDateKey(currentYear, currentMonth, itemDate.getDate());
            next[key] = [...(next[key] ?? []), item];
          });

          for (let d = 1; d <= daysInMonth; d += 1) {
            const key = formatDateKey(currentYear, currentMonth, d);
            next[key] = sortTodosByStoredOrder(next[key] ?? [], storedOrder[key] ?? []);
          }

          return next;
        });
      } catch (error) {
        if (!cancelled) toast.error(toUserMessage(error, "할 일을 불러오지 못했습니다."));
      }
    })();

    return () => { cancelled = true; };
  }, [currentUser, currentYear, currentMonth, daysInMonth, setTodos]);

  const syncTodoList = (
    dateKey: string,
    updater: (items: TodoItem[]) => TodoItem[],
  ) =>
    setTodos((prev) => {
      const nextItems = updater(prev[dateKey] ?? []);
      if (currentUser) {
        const nextOrder = readTodoOrder(currentUser.id);
        nextOrder[dateKey] = nextItems.map((todo) => todo.id);
        writeTodoOrder(currentUser.id, nextOrder);
      }
      return { ...prev, [dateKey]: nextItems };
    });

  const resetTodoDragState = () => {
    setDraggedTodoId(null);
    setDropTargetTodoId(null);
  };

  const handleTodoDragStart = (event: React.DragEvent<HTMLDivElement>, todoId: number) => {
    if (editingTodoId === todoId) { event.preventDefault(); return; }
    setDraggedTodoId(todoId);
    setDropTargetTodoId(todoId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(todoId));
  };

  const handleTodoDragOver = (event: React.DragEvent<HTMLDivElement>, todoId: number) => {
    if (draggedTodoId === null || draggedTodoId === todoId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dropTargetTodoId !== todoId) setDropTargetTodoId(todoId);
  };

  const handleTodoDrop = (event: React.DragEvent<HTMLDivElement>, todoId: number) => {
    event.preventDefault();
    const sourceId = draggedTodoId ?? Number(event.dataTransfer.getData("text/plain"));
    if (!Number.isFinite(sourceId) || sourceId === todoId) { resetTodoDragState(); return; }
    syncTodoList(selectedDateKey, (items: TodoItem[]) => reorderTodos(items, sourceId, todoId));
    resetTodoDragState();
  };

  const handleAddTodo = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !newTodoText.trim() || !currentUser) return;
    try {
      const created = await createTodo(currentUser.id, newTodoText.trim(), selectedDateKey);
      syncTodoList(selectedDateKey, (items) => [...items, created]);
      setNewTodoText("");
    } catch (error) {
      toast.error(toUserMessage(error, "할 일 추가에 실패했습니다."));
    }
  };

  const handleToggleTodo = async (todoId: number) => {
    try {
      const updated = await toggleTodoStatus(todoId);
      syncTodoList(selectedDateKey, (items: TodoItem[]) =>
        items.map((todo) => (todo.id === todoId ? updated : todo)),
      );
    } catch (error) {
      toast.error(toUserMessage(error, "할 일 상태 변경에 실패했습니다."));
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    try {
      await deleteTodoApi(todoId);
      syncTodoList(selectedDateKey, (items: TodoItem[]) => items.filter((todo) => todo.id !== todoId));
    } catch (error) {
      toast.error(toUserMessage(error, "할 일 삭제에 실패했습니다."));
    }
  };

  const startTodoEdit = (todo: TodoItem) => {
    setEditingTodoId(todo.id);
    setEditingTodoText(todo.text);
  };

  const cancelTodoEdit = () => {
    setEditingTodoId(null);
    setEditingTodoText("");
  };

  const handleSubmitTodoEdit = async () => {
    if (editingTodoId === null || !editingTodoText.trim()) return;
    try {
      const updated = await updateTodoContent(editingTodoId, editingTodoText.trim());
      syncTodoList(selectedDateKey, (items: TodoItem[]) =>
        items.map((todo) => (todo.id === editingTodoId ? updated : todo)),
      );
      cancelTodoEdit();
      toast.success("할 일이 수정되었습니다.");
    } catch (error) {
      toast.error(toUserMessage(error, "할 일 수정에 실패했습니다."));
    }
  };

  const requestDeleteTodo = (todo: TodoItem) => {
    setConfirmDialog({
      title: "할 일 삭제",
      message: `"${todo.text}" 할 일을 삭제하시겠습니까?`,
      confirmLabel: "삭제하기",
      tone: "danger",
      onConfirm: () => { void handleDeleteTodo(todo.id); },
    });
  };

  return {
    newTodoText,
    setNewTodoText,
    editingTodoId,
    editingTodoText,
    setEditingTodoText,
    draggedTodoId,
    dropTargetTodoId,
    handleAddTodo,
    handleToggleTodo,
    startTodoEdit,
    cancelTodoEdit,
    handleSubmitTodoEdit,
    requestDeleteTodo,
    handleTodoDragStart,
    handleTodoDragOver,
    handleTodoDrop,
    resetTodoDragState,
  };
}
