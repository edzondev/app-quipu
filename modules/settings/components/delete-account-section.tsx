"use client";

import { useMutation, useQuery } from "convex/react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/core/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/components/ui/dialog";
import { Input } from "@/core/components/ui/input";
import { Separator } from "@/core/components/ui/separator";
import { authClient } from "@/lib/auth-client";

export function DeleteAccountSection() {
  const router = useRouter();
  const email = useQuery(api.profiles.getMyUserEmail);
  const deleteAccount = useMutation(api.users.deleteAccount);

  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const emailIsLoading = email === undefined;
  const emailIsAvailable = typeof email === "string" && email.length > 0;

  const emailMatches = confirmEmail === email;
  const dialogDisabled = !emailIsAvailable || isDeleting;

  const handleDelete = async () => {
    if (!emailMatches || !email) return;
    setIsDeleting(true);
    try {
      await deleteAccount({ confirmEmail });
      await authClient.signOut();
      toast.success("Tu cuenta ha sido eliminada.");
      setOpen(false);
      router.push("/");
    } catch {
      toast.error("No se pudo eliminar la cuenta. Inténtalo de nuevo.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Separator />
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-destructive">
            Zona de peligro
          </h2>
          <p className="text-sm text-muted-foreground">
            Acciones irreversibles sobre tu cuenta.
          </p>
        </div>

        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setConfirmEmail("");
          }}
        >
          <DialogTrigger asChild>
            <Button
              variant="destructive"
              className="gap-2"
              disabled={dialogDisabled}
            >
              <Trash2 className="w-4 h-4" />
              Eliminar cuenta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar cuenta permanentemente</DialogTitle>
              <DialogDescription>
                Esta acción es irreversible. Se eliminarán todos tus datos:
                perfil, gastos, ahorros, objetivos, logros y racha. No podrás
                recuperar nada.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <p className="text-sm">
                {emailIsAvailable ? (
                  <>
                    Escribe <strong>{email}</strong> para confirmar:
                  </>
                ) : emailIsLoading ? (
                  "Cargando correo para confirmar..."
                ) : (
                  "No hay un correo disponible para confirmar la eliminación."
                )}
              </p>
              <Input
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="off"
                disabled={!emailIsAvailable}
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!emailMatches || isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Eliminar mi cuenta"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
