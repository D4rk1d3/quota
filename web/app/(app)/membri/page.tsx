import { redirect } from "next/navigation";

// I membri ora appartengono a un abbonamento specifico (vedi
// /abbonamenti/[id]), non piu' a una lista globale unica.
export default function MembriRedirectPage() {
  redirect("/");
}
