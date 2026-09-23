# Applications Pipeline & Kanban — Page Specification

> **PROJECT:** JobHunt AI  
> **Page Type:** Interactive Kanban Pipeline & Virtualized Application Table  
> **Source of Truth:** Overrides `context/design-system/jobhunt-ai/MASTER.md` for the `/dashboard/applications` route.

---

## 1. Page Layout & View Switcher

- **View Toggle:** Segmented control (`Kanban Board` vs `Table View`).
  - Kanban View: Fluid horizontal scroll container with fixed-width columns (`min-w-[320px]`).
  - Table View: High-density virtualized table powered by `@tanstack/react-virtual` for 100+ applications.
- **Header Bar:** Real-time filter toolbar:
  - Text search (Company, Role, Keyword).
  - Status multi-select filter.
  - Match Score slider (0% to 100%).
  - Date Applied range picker.
  - Quick action: "Sync Email Inbox" button (detects automated rejection/interview emails via webhook).

---

## 2. Kanban Board Architecture (Framer Motion Physics)

### 2.1 Column Definitions
| Column ID | Title | Color Badge | Card Count Rule |
| :--- | :--- | :--- | :--- |
| `discovered` | Discovered | Slate (`#64748B`) | High throughput |
| `matched` | AI Matched | Blue (`#3B82F6`) | Sorted by match score DESC |
| `queued` | In Queue / Review | Amber (`#F59E0B`) | Items needing approval or in agent queue |
| `applied` | Applied | Emerald (`#10B981`) | Timestamp of submission |
| `interviewing`| Interviewing | Violet (`#8B5CF6`) | Highlights interview date / notes |
| `rejected` | Archived | Red / Gray (`#EF4444`) | Rejection feedback / notes |

### 2.2 Drag-and-Drop Rules (Framer Motion + Optimistic UI)
```typescript
// Optimistic UI updates
const handleDragEnd = async (applicationId: string, newStatus: ApplicationStatus) => {
  // 1. Instantly update TanStack Query cache
  queryClient.setQueryData(['applications'], (old: Application[]) => 
    old.map(app => app.id === applicationId ? { ...app, status: newStatus } : app)
  );
  
  // 2. Persist to Supabase in background
  const { error } = await supabase
    .from('applications')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', applicationId);

  if (error) {
    // 3. Rollback cache and show toast if network fails
    queryClient.invalidateQueries({ queryKey: ['applications'] });
    toast.error('Failed to move application. Reverted.');
  }
};
```

---

## 3. Slide-Over Detail Drawer (`ApplicationDetailSheet.tsx`)

When clicking any card:
- Framer Motion slide-in from right edge (`x: '100%' -> 0%`, smooth spring physics `{ type: 'spring', damping: 30, stiffness: 300 }`).
- Backdrop: Frosted dark glass overlay (`backdrop-blur-sm bg-black/50`).
- Content Tabs:
  1. **Overview & Company:** Salary, location, remote status, job description, hiring manager info.
  2. **Match Score Breakdown:** Radial meter + Radar chart comparing user profile vs job requirements.
  3. **Tailored Assets:** View tailored resume PDF, generated cover letter, and answers to custom application questions.
  4. **Agent Timeline & Logs:** Step-by-step history (Scraped -> Evaluated -> Tailored -> Form Filled -> Submitted).

---

## 4. Pre-Delivery Checklist for Applications Page

- [ ] Smooth drag-and-drop at 60 FPS without cursor lag.
- [ ] Optimistic state update with automatic rollback on network failure.
- [ ] Slide-over sheet trap focus inside modal and close on `Escape` key or backdrop click.
- [ ] Empty state with clear illustration and "Add Manual Application" or "Run Agent Now" button.
- [ ] Accessible ARIA: Column `role="list"`, Card `role="listitem"`, drag handle labeled.
