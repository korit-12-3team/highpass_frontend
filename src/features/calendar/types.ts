export type EventFormState = {
  id: string | null;
  title: string;
  content: string;
  startDate: string;
  endDate: string;
  color: string;
  isAllDay: boolean;
  startTime: string;
  endTime: string;
  kind: "general" | "certificate";
};

export type ConfirmDialogState = {
  title: string;
  message: string;
  confirmLabel: string;
  tone: "primary" | "danger";
  onConfirm: () => void;
} | null;
