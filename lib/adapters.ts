// Adapter: converte le righe/RPC del database (sempre in centesimi interi)
// nei tipi di dominio della UI (lib/types.ts, euro in virgola mobile —
// usati SOLO per la formattazione a schermo, mai per ricalcoli). Nessun
// calcolo economico avviene qui: e' tutto gia' stato fatto nel database.

export function centsToEuro(cents: number): number {
  return Math.round(cents) / 100;
}

export function euroToCents(euro: number): number {
  return Math.round(euro * 100);
}
