// Shared rounded-line icon set for Quota mockups (SF Symbols-spirited, not real SF Symbols).
const ICONS = {
  home: "M4 11.5 12 4l8 7.5 M6 10v9h12v-9 M10 19v-5h4v5",
  people: "M9 8m0 0a3 3 0 100 6 3 3 0 000-6 M17 9m0 0a2.3 2.3 0 100 4.6 2.3 2.3 0 000-4.6 M3.3 20c0-3 2.6-5.3 5.7-5.3s5.7 2.3 5.7 5.3 M14.6 15c2.4.4 3.9 2.3 3.9 5",
  calendar: "M4 6.5h16a1 1 0 011 1V19a1 1 0 01-1 1H4a1 1 0 01-1-1V7.5a1 1 0 011-1z M3 10.5h18 M8 4v4 M16 4v4",
  clock: "M3.5 12a8.5 8.5 0 1017 0 8.5 8.5 0 10-17 0 M12 7.5v4.5l3.2 2.1",
  gear: "M9 12a3 3 0 106 0 3 3 0 10-6 0 M17.3 12h2 M15.75 15.75l1.41 1.41 M12 17.3v2 M8.25 15.75l-1.41 1.41 M6.7 12h-2 M8.25 8.25l-1.41-1.41 M12 6.7v-2 M15.75 8.25l1.41-1.41",
  plus: "M12 5v14 M5 12h14",
  chevronRight: "M9 5l7 7-7 7",
  chevronLeft: "M15 5l-7 7 7 7",
  chevronDown: "M5 9l7 7 7-7",
  check: "M5 13l4 4 10-10",
  x: "M6 6l12 12 M18 6L6 18",
  coin: "M3.5 12a8.5 8.5 0 1017 0 8.5 8.5 0 10-17 0 M15 8.2c-.8-.7-1.8-1-2.9-1-2.4 0-4.4 2.1-4.4 4.8s2 4.8 4.4 4.8c1.1 0 2.1-.3 2.9-1M6.3 10.2h6.2M6.3 13.6h6.2",
  pencil: "M4 20l.9-3.9L15.6 5.4l3 3L7.9 19.1 4 20z M13.6 7.4l3 3",
  warning: "M12 4.2 21.5 20H2.5L12 4.2z M12 10v4",
  tray: "M4 13v5.2A1.8 1.8 0 005.8 20h12.4a1.8 1.8 0 001.8-1.8V13 M4 13l2.6-7.5h10.8L20 13 M9 13a3 3 0 006 0",
  envelope: "M3.5 6.2h17a1 1 0 011 1V18a1 1 0 01-1 1h-17a1 1 0 01-1-1V7.2a1 1 0 011-1z M4.2 7.5l7.8 6.2 7.8-6.2",
  wifiSlash: "M3 3l18 18 M2.2 8.5a15 15 0 0116.4-3.3 M5.7 12a10.5 10.5 0 019.3-2.9 M9.2 15.4a6 6 0 015.6-1",
  bell: "M6.2 10.6a5.8 5.8 0 0111.6 0v3.6l1.7 2.8H4.5l1.7-2.8z M9.7 18.9a2.3 2.3 0 004.6 0",
  undo: "M9 7 4 12l5 5 M4 12h11a5 5 0 010 10h-2",
  refresh: "M4.5 12a7.5 7.5 0 0112.7-5.4M19.5 12a7.5 7.5 0 01-12.7 5.4 M17.2 4.9v3.7h-3.7 M6.8 19.1v-3.7h3.7",
  lock: "M6.5 10.8h11a1 1 0 011 1V19a1 1 0 01-1 1h-11a1 1 0 01-1-1v-7.2a1 1 0 011-1z M8.3 10.8V8a3.7 3.7 0 017.4 0v2.8",
  euroSign: "M15.5 8.3a5 5 0 100 7.4 M6.5 10.3h6.3 M6.5 13.6h6.3",
};

function QIcon({ name, size = 20, color = 'currentColor', strokeWidth = 1.7 }) {
  const d = ICONS[name] || ICONS.x;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d={d} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

Object.assign(window, { QIcon, QUOTA_ICONS: ICONS });
