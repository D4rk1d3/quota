/* @ds-bundle: {"format":4,"namespace":"Quota","components":[{"name":"Icon"},{"name":"Button"},{"name":"IconButton"},{"name":"Input"},{"name":"Card"},{"name":"Badge"},{"name":"ProgressBar"},{"name":"Avatar"},{"name":"MemberRow"},{"name":"Sidebar"},{"name":"CapsuleNav"},{"name":"EmptyState"},{"name":"ErrorBanner"},{"name":"Skeleton"}]} */
(function () {
  "use strict";

  var ICONS = {
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
    euroSign: "M15.5 8.3a5 5 0 100 7.4 M6.5 10.3h6.3 M6.5 13.6h6.3"
  };

  var TOKENS = {
    bgBase: "#0B0B0D",
    surface: "#1C1C1E",
    surfaceGlass: "rgba(255,255,255,0.06)",
    borderGlass: "rgba(255,255,255,0.1)",
    accent: "#5B8F6F",
    accentInk: "#7FB093",
    warning: "#E3A548",
    danger: "#E2685C",
    ink: "#FFFFFF",
    inkSecondary: "rgba(255,255,255,0.56)",
    inkCaption: "rgba(255,255,255,0.45)",
    inkTertiary: "rgba(255,255,255,0.35)",
    divider: "rgba(255,255,255,0.08)",
    borderSubtle: "rgba(255,255,255,0.1)",
    radiusCard: "20px",
    radiusCardLg: "22px",
    radiusField: "14px",
    radiusPill: "999px",
    shadowCard: "0 10px 28px rgba(0,0,0,0.35)",
    shadowOverlay: "0 16px 40px rgba(0,0,0,0.5)",
    fontSans: "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif"
  };

  var STATUS_MAP = {
    regolare: { label: "Regolare", color: TOKENS.accentInk, bg: "rgba(91,143,111,0.16)" },
    scadenza: { label: "In scadenza", color: TOKENS.warning, bg: "rgba(227,165,72,0.16)" },
    ritardo: { label: "In ritardo", color: TOKENS.danger, bg: "rgba(226,104,92,0.16)" },
    cancelled: { label: "Annullato", color: TOKENS.inkCaption, bg: "rgba(255,255,255,0.08)" }
  };

  function el(tag, style, attrs) {
    var node = document.createElement(tag);
    if (style) {
      for (var k in style) if (Object.prototype.hasOwnProperty.call(style, k)) node.style[k] = style[k];
    }
    if (attrs) {
      for (var a in attrs) if (Object.prototype.hasOwnProperty.call(attrs, a)) {
        if (a === "text") node.textContent = attrs[a];
        else node.setAttribute(a, attrs[a]);
      }
    }
    return node;
  }

  function append(parent, children) {
    (children || []).forEach(function (c) { if (c) parent.appendChild(c); });
    return parent;
  }

  function Icon(opts) {
    opts = opts || {};
    var name = opts.name || "x";
    var size = opts.size || 20;
    var color = opts.color || "currentColor";
    var strokeWidth = opts.strokeWidth || 1.7;
    var d = ICONS[name] || ICONS.x;
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    var path = document.createElementNS(ns, "path");
    path.setAttribute("d", d);
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", strokeWidth);
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    return svg;
  }

  function Avatar(opts) {
    opts = opts || {};
    var size = opts.size || 40;
    var node = el("div", {
      width: size + "px", height: size + "px", borderRadius: TOKENS.radiusPill,
      background: opts.color || TOKENS.accent, display: "flex", alignItems: "center",
      justifyContent: "center", flexShrink: "0", fontFamily: TOKENS.fontSans,
      fontSize: Math.round(size * 0.36) + "px", fontWeight: "600", color: TOKENS.ink
    });
    node.textContent = opts.initials || "";
    return node;
  }

  function Badge(opts) {
    opts = opts || {};
    var s = STATUS_MAP[opts.status] || STATUS_MAP.regolare;
    var node = el("div", {
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      padding: "5px 12px", borderRadius: TOKENS.radiusPill, background: s.bg
    });
    var span = el("span", {
      fontFamily: TOKENS.fontSans, fontSize: "11.5px", fontWeight: "600", lineHeight: "1", color: s.color
    });
    span.textContent = opts.label || s.label;
    node.appendChild(span);
    return node;
  }

  function Button(opts) {
    opts = opts || {};
    var variant = opts.variant || "primary";
    var isPrimary = variant === "primary";
    var node = el("button", {
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
      height: (opts.height || (isPrimary ? 44 : 32)) + "px",
      padding: isPrimary ? "0 20px" : "0 14px",
      borderRadius: TOKENS.radiusPill,
      background: isPrimary ? TOKENS.accent : "rgba(255,255,255,0.1)",
      border: "none", cursor: opts.disabled ? "default" : "pointer",
      opacity: opts.disabled ? "0.5" : "1", fontFamily: TOKENS.fontSans
    }, { type: "button" });
    if (opts.disabled) node.disabled = true;
    if (opts.loading) {
      node.appendChild(el("div", {
        width: "15px", height: "15px", borderRadius: TOKENS.radiusPill,
        border: "2px solid rgba(255,255,255,0.35)", borderTopColor: TOKENS.ink,
        animation: "quota-spin 0.9s linear infinite"
      }));
    } else if (opts.icon) {
      node.appendChild(Icon({ name: opts.icon, size: isPrimary ? 15 : 13, color: TOKENS.ink }));
    }
    var label = el("span", {
      fontSize: isPrimary ? "14px" : "12.5px", fontWeight: "600", color: TOKENS.ink
    });
    label.textContent = opts.label || "";
    node.appendChild(label);
    if (typeof opts.onClick === "function") node.addEventListener("click", opts.onClick);
    return node;
  }

  function IconButton(opts) {
    opts = opts || {};
    var size = opts.size || 40;
    var node = el("button", {
      width: size + "px", height: size + "px", borderRadius: TOKENS.radiusPill,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: opts.active ? "rgba(111,163,130,0.22)" : (opts.filled ? TOKENS.accent : "transparent"),
      border: "none", cursor: "pointer", padding: "0"
    }, { type: "button" });
    node.appendChild(Icon({
      name: opts.icon, size: opts.iconSize || Math.round(size * 0.5),
      color: opts.active ? "#6FA382" : (opts.filled ? TOKENS.ink : TOKENS.inkSecondary)
    }));
    if (typeof opts.onClick === "function") node.addEventListener("click", opts.onClick);
    return node;
  }

  function Input(opts) {
    opts = opts || {};
    var node = el("div", {
      width: "100%", height: "46px", borderRadius: TOKENS.radiusField,
      background: TOKENS.surface, border: "1px solid " + TOKENS.borderSubtle,
      display: "flex", alignItems: "center", padding: "0 14px", gap: "10px", boxSizing: "border-box"
    });
    if (opts.icon) node.appendChild(Icon({ name: opts.icon, size: 15, color: TOKENS.inkTertiary }));
    var span = el("span", {
      fontFamily: TOKENS.fontSans, fontSize: "13.5px",
      color: opts.value ? TOKENS.ink : TOKENS.inkTertiary
    });
    span.textContent = opts.value || opts.placeholder || "";
    node.appendChild(span);
    return node;
  }

  function Card(opts) {
    opts = opts || {};
    var node = el("div", {
      background: TOKENS.surface,
      borderRadius: opts.size === "lg" ? TOKENS.radiusCardLg : TOKENS.radiusCard,
      padding: opts.padding || "24px 26px",
      boxShadow: opts.shadow === false ? "none" : TOKENS.shadowCard,
      display: "flex", flexDirection: "column", gap: opts.gap || "18px", boxSizing: "border-box"
    });
    if (opts.children) append(node, opts.children);
    return node;
  }

  function ProgressBar(opts) {
    opts = opts || {};
    var max = opts.max || 100;
    var value = Math.max(0, Math.min(opts.value || 0, max));
    var pct = max > 0 ? (value / max) * 100 : 0;
    var track = el("div", {
      width: "100%", height: "8px", borderRadius: TOKENS.radiusPill,
      background: "rgba(255,255,255,0.08)", overflow: "hidden"
    });
    track.appendChild(el("div", {
      width: pct + "%", height: "100%", borderRadius: TOKENS.radiusPill, background: TOKENS.accent
    }));
    return track;
  }

  function MemberRow(opts) {
    opts = opts || {};
    var row = el("div", {
      display: "flex", alignItems: "center", gap: "14px", padding: "13px 6px",
      borderBottom: "1px solid " + TOKENS.divider
    });
    row.appendChild(Avatar({ initials: opts.initials, color: opts.color }));
    var mid = el("div", { flex: "1", minWidth: "0" });
    var nameLine = el("div", {
      fontFamily: TOKENS.fontSans, fontSize: "14.5px", fontWeight: "600", color: "rgba(255,255,255,0.94)"
    });
    nameLine.textContent = opts.person + (opts.you ? "   ·   Tu" : "");
    var sub = el("div", {
      fontFamily: TOKENS.fontSans, fontSize: "12.5px", color: TOKENS.inkSecondary, marginTop: "2px"
    });
    sub.textContent = "Coperto fino al " + (opts.covered || "");
    mid.appendChild(nameLine);
    mid.appendChild(sub);
    row.appendChild(mid);
    row.appendChild(Badge({ status: opts.status }));
    row.appendChild(Icon({ name: "chevronRight", size: 14, color: "rgba(255,255,255,0.28)" }));
    return row;
  }

  var NAV_ITEMS = [
    { key: "dashboard", icon: "home", label: "Dashboard" },
    { key: "members", icon: "people", label: "Membri" },
    { key: "calendar", icon: "calendar", label: "Calendario" },
    { key: "activity", icon: "clock", label: "Attività" },
    { key: "settings", icon: "gear", label: "Impostazioni" }
  ];

  function Sidebar(opts) {
    opts = opts || {};
    var active = opts.active || "dashboard";
    var wrap = el("div", {
      width: "220px", height: "100%", background: TOKENS.surfaceGlass,
      borderRight: "0.5px solid " + TOKENS.borderGlass, boxSizing: "border-box",
      backdropFilter: "blur(40px) saturate(180%)", display: "flex", flexDirection: "column",
      gap: "1px", paddingTop: "6px"
    });
    NAV_ITEMS.forEach(function (item) {
      var sel = item.key === active;
      var row = el("div", {
        display: "flex", alignItems: "center", gap: "10px", height: "30px",
        padding: "0 12px", margin: "0 10px", borderRadius: "8px",
        background: sel ? "rgba(255,255,255,0.12)" : "transparent"
      });
      row.appendChild(Icon({ name: item.icon, size: 17, color: sel ? "#6FA382" : "rgba(255,255,255,0.55)" }));
      var label = el("span", {
        fontFamily: TOKENS.fontSans, fontSize: "12.5px",
        fontWeight: sel ? "600" : "500", color: sel ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.8)"
      });
      label.textContent = item.label;
      row.appendChild(label);
      wrap.appendChild(row);
    });
    return wrap;
  }

  function CapsuleNav(opts) {
    opts = opts || {};
    var active = opts.active || "dashboard";
    var wrap = el("div", {
      display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 14px",
      borderRadius: TOKENS.radiusPill, background: "rgba(30,30,32,0.72)",
      backdropFilter: "blur(24px) saturate(180%)", border: "0.5px solid rgba(255,255,255,0.12)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)"
    });
    NAV_ITEMS.forEach(function (item) {
      var sel = item.key === active;
      wrap.appendChild(IconButton({
        icon: item.icon, active: sel, size: 40, iconSize: 21
      }));
    });
    return wrap;
  }

  function EmptyState(opts) {
    opts = opts || {};
    var node = el("div", {
      background: TOKENS.surface, borderRadius: TOKENS.radiusCard, padding: "48px 24px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: "14px",
      boxShadow: TOKENS.shadowCard
    });
    var iconWrap = el("div", {
      width: "56px", height: "56px", borderRadius: "16px", background: "rgba(255,255,255,0.06)",
      display: "flex", alignItems: "center", justifyContent: "center"
    });
    iconWrap.appendChild(Icon({ name: "tray", size: 26, color: TOKENS.inkTertiary }));
    node.appendChild(iconWrap);
    var title = el("div", { fontFamily: TOKENS.fontSans, fontSize: "15px", fontWeight: "600", color: "rgba(255,255,255,0.85)" });
    title.textContent = opts.title || "Nessun elemento ancora";
    node.appendChild(title);
    var desc = el("div", {
      fontFamily: TOKENS.fontSans, fontSize: "13px", color: TOKENS.inkCaption, textAlign: "center",
      maxWidth: "280px", lineHeight: "1.5"
    });
    desc.textContent = opts.description || "";
    node.appendChild(desc);
    if (opts.ctaLabel) {
      node.appendChild(Button({ label: opts.ctaLabel, icon: "plus", height: 40, onClick: opts.onCta }));
    }
    return node;
  }

  function ErrorBanner(opts) {
    opts = opts || {};
    var node = el("div", {
      display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px",
      borderRadius: TOKENS.radiusField, background: "rgba(226,104,92,0.12)",
      border: "1px solid rgba(226,104,92,0.3)"
    });
    node.appendChild(Icon({ name: "wifiSlash", size: 17, color: TOKENS.danger }));
    var mid = el("div", { flex: "1" });
    var title = el("div", { fontFamily: TOKENS.fontSans, fontSize: "13px", fontWeight: "600", color: TOKENS.danger });
    title.textContent = opts.title || "Impossibile aggiornare i dati";
    var desc = el("div", { fontFamily: TOKENS.fontSans, fontSize: "12px", color: TOKENS.inkSecondary, marginTop: "1px" });
    desc.textContent = opts.description || "Verifica la connessione e riprova.";
    mid.appendChild(title);
    mid.appendChild(desc);
    node.appendChild(mid);
    node.appendChild(Button({ label: "Riprova", icon: "refresh", variant: "secondary", onClick: opts.onRetry }));
    return node;
  }

  function Skeleton(opts) {
    opts = opts || {};
    return el("div", {
      width: opts.width || "100%", height: opts.height || "11px",
      borderRadius: opts.radius || "6px", background: opts.background || "rgba(255,255,255,0.1)",
      animation: "quota-pulse 1.3s ease-in-out infinite alternate"
    });
  }

  window.Quota = {
    tokens: TOKENS,
    icons: ICONS,
    Icon: Icon,
    Avatar: Avatar,
    Badge: Badge,
    Button: Button,
    IconButton: IconButton,
    Input: Input,
    Card: Card,
    ProgressBar: ProgressBar,
    MemberRow: MemberRow,
    Sidebar: Sidebar,
    CapsuleNav: CapsuleNav,
    EmptyState: EmptyState,
    ErrorBanner: ErrorBanner,
    Skeleton: Skeleton
  };
})();
