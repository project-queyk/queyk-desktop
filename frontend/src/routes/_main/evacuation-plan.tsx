import { Download } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { Dialogs } from "@wailsio/runtime";

import { safetyGuidelines } from "@/constants/safety-guidelines";
import { SavePDFReport } from "../../../bindings/queyk/internal/dashboard/service";

import { Button } from "@/components/ui/button";
import MobileFloorPlans from "@/components/evacuation-plan/MobileFloorPlans";
import DesktopFloorPlans from "@/components/evacuation-plan/DesktopFloorPlans";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/_main/evacuation-plan")({
  component: EvacuationPlan,
});

function EvacuationPlan() {
  async function downloadEvacuationPlan() {
    try {
      const response = await fetch("/documents/evacuation-plan.pdf");
      const buffer = await response.arrayBuffer();

      if (Dialogs?.SaveFile) {
        const filePath = await Dialogs.SaveFile({
          Filename: "Queyk-Evacuation-Plan.pdf",
          Filters: [
            {
              DisplayName: "PDF Files (*.pdf)",
              Pattern: "*.pdf",
            },
          ],
        });
        if (filePath) {
          const bytes = new Uint8Array(buffer);
          const chunkSize = 0x8000;
          let binary = "";
          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(
              null,
              bytes.subarray(i, i + chunkSize) as unknown as number[],
            );
          }
          await SavePDFReport(filePath, btoa(binary));
          return;
        }
        return;
      }

      const blob = new Blob([buffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Queyk-Evacuation-Plan.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      try {
        window.open("/documents/evacuation-plan.pdf", "_blank");
      } catch {}
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2"></div>
      <Card className="w-full">
        <CardHeader className="mx-4.5 flex items-stretch space-y-0 border-b p-0">
          <div className="flex flex-1 flex-col justify-center gap-1 px-1.5 pt-2">
            <CardTitle>Evacuation Floor Plans</CardTitle>
            <CardDescription>
              Select a floor to view evacuation routes
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="hidden h-8 cursor-pointer md:flex"
            onClick={downloadEvacuationPlan}
          >
            <Download className="mr-2 h-4 w-4" />
            <span>Download PDF</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 cursor-pointer md:hidden"
            onClick={downloadEvacuationPlan}
          >
            <Download className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 px-6 pb-4">
          <div className="md:hidden">
            <MobileFloorPlans />
          </div>
          <div className="hidden md:block">
            <DesktopFloorPlans />
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="mx-4.5 flex flex-col items-stretch space-y-0 border-b p-0">
          <div className="flex flex-1 flex-col justify-center gap-1 px-1.5 pt-2">
            <CardTitle>{safetyGuidelines.header}</CardTitle>
            <CardDescription>{safetyGuidelines.description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 px-6 pb-4">
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {safetyGuidelines.bulletItems.map((bullet) => (
              <div className="flex flex-col gap-2" key={bullet.title}>
                <h3 className="text-primary font-semibold">{bullet.title}</h3>
                <p className="text-muted-foreground text-sm whitespace-pre-line">
                  {bullet.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground mt-2 text-center text-xs md:text-sm">
        Based on guidelines from NDRRMC, PHIVOLCS, and the Philippine Disaster
        Risk Reduction and Management Act (RA 10121)
      </div>
    </div>
  );
}
