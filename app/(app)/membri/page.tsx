"use client";
import { PageShell } from "@/components/quota/page-shell";
import { MembersView } from "@/components/quota/members-view";
import { AddMemberDialog } from "@/components/quota/add-member-dialog";
import { useQuotaData } from "@/components/quota/quota-data-provider";
import { sortMembersByAttention } from "@/lib/domain";

export default function MembriPage() {
  const { members } = useQuotaData();
  const sorted = sortMembersByAttention(members);
  return (
    <PageShell title="Membri" subtitle={`${sorted.length} persone nel piano Family`} action={<AddMemberDialog />}>
      <MembersView members={sorted} />
    </PageShell>
  );
}
