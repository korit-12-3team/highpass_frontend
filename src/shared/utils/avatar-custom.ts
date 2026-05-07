export type AvatarCustomOption = {
  id: string;
  label: string;
  className: string;
};

export const DEFAULT_AVATAR_VISUAL_CLASS = "bg-hp-100 font-bold text-hp-700";

export const AVATAR_CUSTOM_OPTIONS: AvatarCustomOption[] = [
  { id: "highpass", label: "기본", className: DEFAULT_AVATAR_VISUAL_CLASS },
  { id: "slate", label: "차콜", className: "bg-slate-900 font-bold text-white" },
  { id: "sky", label: "스카이", className: "bg-sky-100 font-bold text-sky-700" },
  { id: "emerald", label: "민트", className: "bg-emerald-100 font-bold text-emerald-700" },
  { id: "rose", label: "로즈", className: "bg-rose-100 font-bold text-rose-700" },
  { id: "amber", label: "앰버", className: "bg-amber-100 font-bold text-amber-700" },
];
