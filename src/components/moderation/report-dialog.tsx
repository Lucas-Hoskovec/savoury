"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { createReport, type TargetType } from "@/actions/reports";
import { REPORT_REASONS } from "@/lib/moderation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  type: TargetType;
  targetId: string;
  className?: string;
  "aria-label"?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ReportDialog({
  type,
  targetId,
  className,
  "aria-label": ariaLabel,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [pending, setPending] = useState(false);

  const dialogOpen = open ?? internalOpen;
  const setDialogOpen = (value: boolean) => (onOpenChange ? onOpenChange(value) : setInternalOpen(value));

  async function handleSubmit() {
    if (!reason || pending) return;
    setPending(true);
    const res = await createReport({ type, targetId, reason, details });
    setPending(false);
    if ("error" in res) {
      toast.error(res.error);
      if (res.error === "Connecte-toi pour signaler") {
        router.push("/login");
      }
      return;
    }
    setDialogOpen(false);
    setReason("");
    setDetails("");
    toast.success("Signalement envoyé. Merci pour ta vigilance.");
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel ?? "Signaler ce contenu"}
          className={className ?? "text-muted-foreground transition-colors hover:text-destructive"}
        >
          <Flag className="size-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Signaler ce contenu</DialogTitle>
          <DialogDescription>
            Ton signalement sera examiné par un administrateur. Il est anonyme.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="report-reason">Motif</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="report-reason">
                <SelectValue placeholder="Choisis un motif" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-details">Détails (facultatif)</Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Précise le problème…"
              maxLength={500}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            disabled={!reason || pending}
            onClick={handleSubmit}
          >
            Envoyer le signalement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}