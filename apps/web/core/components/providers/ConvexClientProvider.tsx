"use client"

import {
  type AuthClient,
  ConvexBetterAuthProvider,
} from "@convex-dev/better-auth/react"
import { ConvexReactClient } from "convex/react"
import type { ReactNode } from "react"
import { authClient } from "@/lib/auth-client"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? "", {
  unsavedChangesWarning: false,
})

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexBetterAuthProvider
      client={convex}
      authClient={authClient as unknown as AuthClient}
    >
      {children}
    </ConvexBetterAuthProvider>
  )
}
