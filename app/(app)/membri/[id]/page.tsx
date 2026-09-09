import { notFound } from "next/navigation";
import { PageShell } from "@/components/quota/page-shell";
import { MemberDetail } from "@/components/quota/member-detail";
import { getMemberDetail } from "@/lib/supabase/queries";

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getMemberDetail(id);
  if (!result) notFound();

  return (
    <PageShell title={result.member.name} subtitle="Dettaglio membro">
      <MemberDetail member={result.member} payments={result.payments} />
    </PageShell>
  );
}
