import { Button } from "@/core/components/ui/button";
import { isAuthenticated } from "@/lib/auth-server";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<{}>;

export default async function AuthLayout({ children }: Props) {
  // Con sesión activa no tiene sentido ver login/register
  const authed = await isAuthenticated();
  if (authed) redirect("/dashboard");
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-start">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-2 font-medium">
              <ArrowLeft className="size-4" />
              Volver al inicio
            </Link>
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>
      <div className="relative hidden bg-white lg:block">
        <Image
          src="/quipu.webp"
          alt="Decorative background"
          fill
          sizes="50vw"
          className="object-contain dark:brightness-[0.2] dark:grayscale"
          priority
        />
      </div>
    </div>
  );
}
