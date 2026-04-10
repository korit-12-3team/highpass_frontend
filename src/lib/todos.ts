"use client";

import { TodoItem } from "@/lib/AppContext";
import { fetchWithAuth } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";

type TodoApiRecord = {
  id?: number | string;
  content?: string;
  date?: string;
  status?: boolean;
};

function mapTodo(record: TodoApiRecord): TodoItem {
  return {
    id: Number(record.id ?? Date.now()),
    text: typeof record.content === "string" ? record.content : "",
    done: Boolean(record.status),
    createdAt: typeof record.date === "string" ? record.date : "",
  };
}

export async function listTodosByDate(userId: string, date: string): Promise<TodoItem[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/todos/${userId}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("할 일 목록을 불러오지 못했습니다.");
  }

  const data = (await response.json()) as TodoApiRecord[];
  if (!Array.isArray(data)) return [];
  return data.map(mapTodo).filter((todo) => todo.createdAt === date);
}

export async function listTodos(userId: string): Promise<TodoItem[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/todos/${userId}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("할 일 목록을 불러오지 못했습니다.");
  }

  const data = (await response.json()) as TodoApiRecord[];
  if (!Array.isArray(data)) return [];
  return data.map(mapTodo);
}

export async function createTodo(userId: string, content: string, date: string): Promise<TodoItem> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/todos/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content,
      date,
      status: false,
    }),
  });

  if (!response.ok) {
    throw new Error("할 일을 추가하지 못했습니다.");
  }

  const data = (await response.json()) as TodoApiRecord;
  return mapTodo(data);
}

export async function toggleTodoStatus(todoId: number): Promise<TodoItem> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/todos/${todoId}/status`, {
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error("할 일 상태를 변경하지 못했습니다.");
  }

  const data = (await response.json()) as TodoApiRecord;
  return mapTodo(data);
}

export async function updateTodoContent(todoId: number, content: string): Promise<TodoItem> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/todos/${todoId}/content`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error("할 일을 수정하지 못했습니다.");
  }

  const data = (await response.json()) as TodoApiRecord;
  return mapTodo(data);
}

export async function deleteTodo(todoId: number) {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/todos/${todoId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("할 일을 삭제하지 못했습니다.");
  }
}
