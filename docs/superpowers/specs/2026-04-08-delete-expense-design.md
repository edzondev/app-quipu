# Delete Expense — Design Spec

**Date:** 2026-04-08  
**Status:** Approved for implementation

---

## Context

Users need the ability to delete an expense from the edit sheet/modal. Currently the edit UI only allows updating fields. Deletion must feel deliberate (confirmation dialog) but be accessible from the same edit surface, following the existing destructive action pattern in the project.

---

## What already exists

- **`convex/expenses.ts:240` — `deleteExpense` mutation**: already implemented, validates ownership via `getProfileOrThrow`, throws `ConvexError("Expense not found")` if not found or mismatched profile. No new backend code needed.
- **`modules/savings/components/withdraw-button.tsx`**: exact reference pattern — uses `useMutation` directly in the component (no separate hook file), wraps an `AlertDialog` with `AlertDialogTrigger asChild` and `AlertDialogAction variant="destructive"`.
- **`core/components/ui/alert-dialog.tsx`**: shadcn/ui AlertDialog, already in the project.
- **`modules/expenses/components/edit-expense-modal.tsx`**: renders two branches — `Dialog` (desktop) and `Drawer` (mobile) — both embedding `EditExpenseForm`.

---

## Design

### New component: `DeleteExpenseButton`

**File:** `modules/expenses/components/delete-expense-button.tsx`

A self-contained component that renders an `AlertDialog`. On trigger, shows a confirmation dialog. On confirm, calls `api.expenses.deleteExpense` and invokes `onDelete()` to close the parent modal/drawer.

```
Props:
  expenseId: Id<"expenses">
  onDelete: () => void      // called after successful deletion
```

Internally uses `useMutation(api.expenses.deleteExpense)` directly (same as `withdraw-button.tsx`). Errors are handled gracefully — shown inside the AlertDialog description.

**Button trigger:** full-width, `variant="destructive"`, text "Eliminar gasto".

**AlertDialog copy (Spanish):**
- Title: `¿Eliminar este gasto?`
- Description: `Esta acción no se puede deshacer.`
- Cancel: `Cancelar`
- Confirm: `Eliminar` (`variant="destructive"`)

---

### Modified: `EditExpenseModal`

**File:** `modules/expenses/components/edit-expense-modal.tsx`

Add `DeleteExpenseButton` in both branches, visually separated from the save/cancel buttons:

**Desktop (Dialog):**
```
DialogContent
  DialogHeader
  EditExpenseForm          ← "Guardar cambios" inside
  <Separator className="my-2" />
  DeleteExpenseButton      ← new, full-width destructive
```

**Mobile (Drawer):**
```
DrawerContent
  DrawerHeader
  EditExpenseForm          ← "Guardar cambios" inside
  DrawerFooter
    DeleteExpenseButton    ← new, full-width destructive
    DrawerClose > Button "Cancelar"
```

The `handleSuccess` callback (already exists, calls `onOpenChange(false)`) is passed as `onDelete` to `DeleteExpenseButton`. No new callback needed.

---

## Data flow

1. User opens edit modal → clicks "Eliminar gasto"
2. `AlertDialog` opens (Radix portal, renders outside Drawer DOM tree — no nesting issue)
3. User clicks "Eliminar" → `deleteExpense({ expenseId })` mutation fires
4. Convex deletes the document → reactive query `listExpenses` auto-updates
5. `onDelete()` is called → `onOpenChange(false)` closes modal/drawer
6. If user clicks "Cancelar" in dialog → dialog closes, stays in edit modal

---

## Files changed

| File | Action |
|------|--------|
| `modules/expenses/components/delete-expense-button.tsx` | **Create** |
| `modules/expenses/components/edit-expense-modal.tsx` | **Modify** |

No changes to: Convex backend, `EditExpenseForm`, schemas, hooks, `list-card.tsx`.

---

## Verification

1. `bun dev` + `npx convex dev` — app compiles without errors
2. Open the Gastos page, click any expense row → edit modal/drawer opens
3. Desktop: delete button appears below a separator, below "Guardar cambios"
4. Mobile: delete button appears in `DrawerFooter` above "Cancelar"
5. Clicking delete → AlertDialog opens with Spanish copy
6. Cancelling → stays in edit modal, no mutation fired
7. Confirming → expense removed from list immediately (Convex reactive), modal closes
8. `bun run lint` passes with no errors
