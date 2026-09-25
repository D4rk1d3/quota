import { redirect } from "next/navigation";

// I membri si gestiscono ora dentro /abbonamenti/[id] (vedi
// SubscriptionDetailView), non su una propria pagina di dettaglio.
export default function MemberDetailRedirectPage() {
  redirect("/");
}
