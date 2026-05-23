# Task 189 — O.4: Reversible Agent-Registration Step

**Date:** 2026-05-23  
**Epic:** O — Auth, Registration & Phone Input  
**Status:** ✅ Complete

## Problem

From the standard registration form, clicking "Register as agent" switched the AuthSheet to the `register-agent` view — a separate mount of `RegisterView` with fresh state. There was no way to go back to standard registration without closing the sheet, losing all entered fields.

## Solution

### Shared state lift in `AuthSheet`

Added `SharedRegFields` interface and `regShared` state in `AuthSheet`:

```tsx
interface SharedRegFields {
  name: string; email: string; password: string; phone: PhoneFieldValue
}

const [regShared, setRegShared] = useState<SharedRegFields>({
  name: '', email: '', password: '', phone: DEFAULT_PHONE_VALUE
})
```

Reset on every sheet open (in the existing `useEffect`):
```tsx
if (open) {
  setView(initialView)
  setRegShared({ name: '', email: '', password: '', phone: DEFAULT_PHONE_VALUE })
}
```

### `RegisterView` new props

- `initialShared?: SharedRegFields` — seeds local state for name/email/password/phone
- `onSharedChange?: (v: SharedRegFields) => void` — called whenever any shared field changes
- `onBack?: () => void` — back callback; renders `← register_back_to_standard` link when truthy and `isAgent`

State initialization changed from `useState('')` to `useState(initialShared?.name ?? '')` etc.

Each shared field's onChange now syncs to parent:
```tsx
onChange={e => { const v = e.target.value; setName(v); onSharedChange?.({ name: v, email, password, phone }) }}
```

### Back button

Placed at the top of the form (after error alert), visible only when `isAgent && onBack`:
```tsx
{isAgent && onBack && (
  <button type="button" onClick={onBack}
    className="text-sm text-muted-foreground hover:text-primary transition-colors -mt-1 text-left">
    ← {t('register_back_to_standard')}
  </button>
)}
```

Top placement chosen because the agent form is the longest form in the sheet (6 fields + company add); a bottom back link would require scrolling past everything.

### AuthSheet render

Standard register view:
```tsx
<RegisterView isAgent={false} ... initialShared={regShared} onSharedChange={setRegShared} />
```

Agent register view:
```tsx
<RegisterView isAgent onBack={() => setView('register')} ... initialShared={regShared} onSharedChange={setRegShared} />
```

### Locale keys added — `auth.register_back_to_standard`

| Locale | Value |
|---|---|
| sq | "Kthehu te regjistrimi standard" |
| en | "Back to standard registration" |
| uk | "Повернутися до стандартної реєстрації" |
| it | "Torna alla registrazione standard" |

## Verification

- `tsc --noEmit` → 0 errors
- `grep register_back_to_standard messages/en.json` → line 288 (auth namespace)
- `grep onBack src/modules/auth/components/AuthSheet.tsx` → line 743 agent view only (standard view has no onBack)
- `grep SharedRegFields src/modules/auth/components/AuthSheet.tsx` → interface + useState + both RegisterView usages
