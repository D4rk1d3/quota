"use client";
import * as React from "react";
import { PageShell } from "@/components/quota/page-shell";
import { Card } from "@/components/ui/card";
import { MonthCalendar } from "@/components/quota/month-calendar";
import { AgendaList } from "@/components/quota/agenda-list";
import { MonthDeadlinesPanel } from "@/components/quota/month-deadlines-panel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function CalendarioPage() {
  return (
    <PageShell title="Calendario" subtitle="Addebiti e pagamenti del gruppo">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          {/* Mobile: toggle Mese / Agenda per mantenere leggibilità */}
          <div className="lg:hidden">
            <Tabs defaultValue="agenda">
              <TabsList className="mb-4">
                <TabsTrigger value="agenda">Agenda</TabsTrigger>
                <TabsTrigger value="mese">Mese</TabsTrigger>
              </TabsList>
              <TabsContent value="agenda">
                <Card className="p-5">
                  <AgendaList />
                </Card>
              </TabsContent>
              <TabsContent value="mese">
                <Card className="p-5">
                  <MonthCalendar />
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop: griglia mensile sempre visibile */}
          <Card className="hidden p-6 lg:block">
            <MonthCalendar />
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <MonthDeadlinesPanel />
        </div>
      </div>
    </PageShell>
  );
}
