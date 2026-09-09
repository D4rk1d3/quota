import { PageShell } from "@/components/quota/page-shell";
import { SettingsForm } from "@/components/quota/settings-form";

export default function ImpostazioniPage() {
  return (
    <PageShell title="Impostazioni" subtitle="Piano, notifiche e fondo condiviso">
      <div className="max-w-xl">
        <SettingsForm />
      </div>
    </PageShell>
  );
}
