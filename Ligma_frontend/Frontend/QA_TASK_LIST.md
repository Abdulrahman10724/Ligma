Task List UI — Implementation QA Checklist

Context & Goals
- Purpose: ClickUp-inspired task list UI for workspace tasks with strong accessibility and consistent tokens.
- Goal: Provide a production-ready component set (`TaskList`, `TaskItem`, `TaskControls`) and token stylesheet for rapid integration.

Design Tokens & Foundations
- Tokens provided in `src/styles/taskTokens.css` and build on global variables defined in `src/index.css`.
- Typography, spacing, colors, radius, and focus ring are semantic tokens and must be used by components.

Component-level Rules
- `TaskList` (container)
  - Role: `list`, keyboard focusable container
  - Keyboard:
    - ArrowDown / ArrowUp: move focus between items
    - Home / End: jump to first/last
    - Enter / Space: activate the focused item (call `onSelect`)
  - Behavior: maintain a roving tabindex pattern; focused item receives `tabindex=0`, others `-1`.

- `TaskItem` (item)
  - Role: `listitem`, each item is an interactive region.
  - Visible states: default, focused (focus ring), selected (aria-selected=true)
  - Content: title (required), description (optional), metadata badges (references/emails)
  - Accessible name: the title should be the primary text, and screen readers should read the description when present.

- `TaskControls` (affordances)
  - Buttons: complete toggle, edit, delete
  - Each control must have `aria-label` and focus-visible styles
  - Actions must stop event propagation to avoid triggering item activation

Accessibility Requirements (testable)
- Keyboard-only navigation: all operations (focus, open, complete, delete) must be possible by keyboard.
- Focus indicators: focused item and focused control display a visible ring (not only color change).
- Contrast: text must meet WCAG AA against background (verify with a contrast tool).
- Screen reader: items must expose `role=listitem` and interactive controls should have descriptive `aria-label`.

Content & Tone Standards
- Titles: concise imperative form ("Fix login flow", not "Fixing the login...").
- Metadata: concise, use badges for quick scanning.

Anti-patterns
- Do not rely solely on color to convey status (use icons/text).
- Do not render interactive elements without keyboard focusability.
- Do not create tiny touch targets (minimum 44x44px recommended on touch devices).

QA Checklist (pass/fail)
- [ ] `TaskList` navigates with ArrowUp/Down and Home/End.
- [ ] Focus ring is visible on keyboard focus (not only hover).
- [ ] Buttons have `aria-label` and are reachable by keyboard.
- [ ] Reference links open in a new tab and have visible affordance.
- [ ] Deleting a task prompts confirmation and triggers a refresh.
- [ ] Subtasks with empty titles are not rendered.
- [ ] Color contrast passes WCAG AA for primary text and badges.

Integration Notes
- Styles are additive; include `src/styles/taskTokens.css` in your layout or component entry.
- `TaskList` emits `ligma:tasks:edit` and `ligma:tasks:refresh` events for simple integration hooks; parent can listen and act.


*** End Patch