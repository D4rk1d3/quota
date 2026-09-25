// Quota — bundle types (documentation only; not type-checked).
// window.Quota is a plain object of DOM-returning factory functions, no framework required.

declare namespace Quota {
  type Status = "regolare" | "scadenza" | "ritardo" | "cancelled";
  type ButtonVariant = "primary" | "secondary";

  /** Renders one icon from the 22-icon Quota set as an inline <svg>. Unknown names fall back to "x". */
  function Icon(props: { name: string; size?: number; color?: string; strokeWidth?: number }): SVGSVGElement;

  /** Circular avatar filled with an identifying color and initials. Use tokens.avatar-1..5 or avatar-you. */
  function Avatar(props: { initials: string; color?: string; size?: number }): HTMLDivElement;

  /** Status pill: colored label + tinted background from STATUS_MAP (regolare/scadenza/ritardo/cancelled). */
  function Badge(props: { status?: Status; label?: string }): HTMLDivElement;

  /** Pill button. variant "primary" = filled accent, 44px; "secondary" = translucent, 32px (e.g. "Riprova"). */
  function Button(props: {
    label: string;
    icon?: string;
    variant?: ButtonVariant;
    loading?: boolean;
    disabled?: boolean;
    height?: number;
    onClick?: () => void;
  }): HTMLButtonElement;

  /** Circular icon-only button used in nav (CapsuleNav) and compact actions (e.g. "+" in Members header). */
  function IconButton(props: {
    icon: string;
    active?: boolean;
    filled?: boolean;
    size?: number;
    iconSize?: number;
    onClick?: () => void;
  }): HTMLButtonElement;

  /** Text-field-shaped row (non-interactive shell) matching the login email field. */
  function Input(props: { icon?: string; placeholder?: string; value?: string }): HTMLDivElement;

  /** Surface container. size "lg" = radius-card-lg (22px, dashboard hero card only); default = radius-card (20px). */
  function Card(props: {
    size?: "default" | "lg";
    padding?: string;
    gap?: string;
    shadow?: boolean;
    children?: Node[];
  }): HTMLDivElement;

  /** Track + accent fill, height 8px, fully rounded. */
  function ProgressBar(props: { value: number; max?: number }): HTMLDivElement;

  /** Avatar + name + "Coperto fino al …" + status Badge + chevron. The atomic list row for members. */
  function MemberRow(props: {
    initials: string;
    color: string;
    person: string;
    covered: string;
    status?: Status;
    you?: boolean;
  }): HTMLDivElement;

  /** macOS glass sidebar nav, 220px wide, 5 fixed items (dashboard/members/calendar/activity/settings). */
  function Sidebar(props: { active?: string }): HTMLDivElement;

  /** Android floating pill nav, glass background, same 5 items as icon-only IconButtons. */
  function CapsuleNav(props: { active?: string }): HTMLDivElement;

  /** Empty-state card: tray icon, headline title, subheadline description, optional primary CTA. */
  function EmptyState(props: {
    title?: string;
    description?: string;
    ctaLabel?: string;
    onCta?: () => void;
  }): HTMLDivElement;

  /** Danger banner with retry action; pair with reduced-opacity (0.35) stale content beneath it. */
  function ErrorBanner(props: {
    title?: string;
    description?: string;
    onRetry?: () => void;
  }): HTMLDivElement;

  /** Pulsing gray placeholder block for loading states. Shape it (width/height/radius) like the real content. */
  function Skeleton(props: { width?: string; height?: string; radius?: string; background?: string }): HTMLDivElement;

  /** Raw design tokens mirrored from tokens.json, for components that need a value directly (e.g. custom layout). */
  const tokens: Record<string, string>;

  /** Raw icon path data (name -> SVG path `d`), the same source Icon() renders from. */
  const icons: Record<string, string>;
}
