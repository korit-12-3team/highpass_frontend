import Image from "next/image";
import { DEFAULT_AVATAR_VISUAL_CLASS } from "@/shared/utils/avatar-custom";

type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  alt?: string;
  size?: AvatarSize;
  className?: string;
  customVisualClassName?: string;
}

const sizeClass: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

function getInitial(name?: string | null) {
  const trimmed = name?.trim();
  return trimmed ? [...trimmed][0] : "U";
}

export default function Avatar({
  src,
  name,
  alt,
  size = "md",
  className = "",
  customVisualClassName,
}: AvatarProps) {
  const isCustomColor = customVisualClassName?.includes("|") || customVisualClassName?.startsWith("#");

  let visualClass = DEFAULT_AVATAR_VISUAL_CLASS;
  let visualStyle: React.CSSProperties = {};

  if (customVisualClassName?.includes("|")) {
    const [bg, text] = customVisualClassName.split("|");
    visualClass = "";
    visualStyle = { backgroundColor: bg, color: text };
  } else if (customVisualClassName?.startsWith("#")) {
    visualClass = "";
    visualStyle = { backgroundColor: customVisualClassName, color: "#fff" };
  } else {
    visualClass = customVisualClassName ?? DEFAULT_AVATAR_VISUAL_CLASS;
  }
  
  const hasCustomClass = className.trim().length > 0;
  const hasPositionClass = /\b(?:static|fixed|absolute|relative|sticky)\b/.test(className);
  const positionClass = hasPositionClass ? "" : "relative";
  const baseClass = `${positionClass} inline-flex shrink-0 items-center justify-center overflow-hidden [container-type:inline-size]`;
  const defaultClass = `rounded-full ${sizeClass[size]}`;

  const wrapperClass = [baseClass, visualClass, hasCustomClass ? className : defaultClass]
    .filter(Boolean)
    .join(" ");

  if (src) {
    return (
      <span className={wrapperClass} style={visualStyle}>
        <Image
          src={src}
          alt={alt || name || "profile image"}
          fill
          sizes="64px"
          className="object-cover"
        />
      </span>
    );
  }

  return (
    <span className={wrapperClass} style={visualStyle} aria-label={alt || name || "user avatar"}>
      <span style={{ fontSize: "55cqi", lineHeight: 1, fontFamily: "var(--font-avatar)" }}>
        {getInitial(name)}
      </span>
    </span>
  );
}