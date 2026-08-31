## Task: Implement “Second Chance Review” feature

You are in planning mode. Your job is to produce a detailed implementation plan (not code) for adding a second‑chance review mechanism to an existing scripture‑memorization app. Use the known component/file names and constraints below, but do not assume you know existing function or variable names. Where you need to refer to existing logic, describe it behaviorally and indicate that the plan must first inspect the codebase to discover actual names.

### Goal

Add a “second chance” flow for failed reviews so that:

- A single failed review does not immediately restart the learning process.
- The verse is flagged for a second‑chance review on the next day.
- If the second‑chance review is passed, the interval is reduced to a configurable percent of the previous interval (default 60%).
- If the second‑chance review is also failed, the verse restarts from interval 1 (learning process).
- The feature is visible to the user in the ReviewSessions verse-list and in the verse display during review.
- Users can configure the recovery percent in Settings.

### Known anchors

You may rely on these names/elements as they exist in the codebase:

- Component: `ReviewSessions.svelte`
- Component: `SingleTextReview.svelte`
- Component: `IndividualReview.svelte`
- Component: `Settings.svelte`
- A `div` in the Single text and individual review UIs with the name/class `verse-display`
- A CSS color variable: `--warning-color`

You must not assume any other function, variable, or type names. Your plan must include steps to discover them by reading the relevant files.

***

## High‑level requirements

1. **Data model extension**
   - Extend the verse data structure to support a second‑chance state:
     - A flag indicating whether a second chance is active.
     - The original interval before the failure.
     - The date/time of the first failure.
     - The due date/time for the second‑chance review (failure date + 1 day).
   - Ensure this data can be persisted and loaded with the rest of the verse data.

2. **Scheduling logic**
   - When a user fails a review on a verse that is not already in second‑chance mode:
     - Enter second‑chance mode:
       - Preserve the current interval.
       - Record the failure date and compute the second‑chance due date (next day).
       - Do not change the verse’s normal due date or repetition count at this point.
   - While second‑chance mode is active:
     - Any review of that verse before the second‑chance due time must not change the interval or repetition count.
     - The second‑chance flag must prevent normal interval updates during this window.
   - When the user reviews the verse at or after the second‑chance due time:
     - If they pass:
       - Compute a new interval as `floor(originalInterval * recoveryPercent / 100)`, with a minimum of 1 day.
       - Set the next due date based on the second‑chance review date plus the new interval.
       - Clear the second‑chance state.
     - If they fail:
       - Restart the verse to interval 1 (or the app’s standard initial interval for learning).
       - Reset repetitions as per the existing “restart learning” behavior.
       - Clear the second‑chance state.
   - If the user manually changes the review interval via the existing manual interval‑change feature:
     - Immediately clear the second‑chance state.
     - Apply the user‑specified interval and recompute the due date according to existing logic.

3. **Configurable recovery percent**
   - Add a new setting:
     - Name: something like “Second‑chance recovery percent”.
     - Default value: 60.
     - Allowed range: e.g., 10–100 (enforced in UI and/or logic).
   - Store this setting alongside other app settings.
   - Use this setting in the scheduling logic when computing the new interval after a successful second‑chance review.

4. **UI: ReviewSessions verse-list**
   - In `ReviewSessions.svelte`, for each verse that is due:
     - Detect whether the verse is in second‑chance mode and whether the second‑chance review is not yet due, due now, or overdue.
     - If in second‑chance mode:
       - Show a message similar in style to the existing “(Due in X hours)” message, but with different text, e.g.:
         - “(Second Chance in X hours)” when the second‑chance due time is in the future.
         - “(Second Chance due now)” when the second‑chance due time has arrived or passed.
   - If not in second‑chance mode, retain the existing “(Due in X hours)” / “(Due now)” behavior.

5. **UI: Verse display during review**
   - In the individualreview and singletextreview screens where the `verse-display` div is used:
     - When the currently focused verse is in second‑chance mode:
       - Apply an additional CSS class or inline style to `verse-display` that changes its border color to `--warning-color`.
     - When the verse is not in second‑chance mode, the border should use the normal color.
   - After the second‑chance review is completed (success or failure), the second‑chance state is cleared, and the border must return to its normal color.

6. **UI: Settings**
   - In `Settings.svelte`:
     - Add a new setting control for “Second‑chance recovery percent”:
       - Numeric input (e.g., type="number").
       - Default value: 60.
       - Enforce a reasonable range (e.g., 10–100) with clamping or validation.
       - Include an info button, that when clicked displays an info modal. That modal displays a short description explaining that this percent is applied to the previous interval when a second‑chance review is passed and provides an example.
     - Ensure changes to this setting are persisted with the rest of the app settings.
     - Ensure the scheduling logic reads this setting when computing the new interval after a successful second‑chance review.

7. **Edge cases and cleanup**
   - Define behavior if a second‑chance review is never taken:
     - I chose Option B: Leave the second‑chance flag active until the next review, at which point treat it as the second‑chance review.
   - Ensure that manual interval changes always clear the second‑chance state, even if performed before the second‑chance due time.
   - Ensure that the second‑chance logic does not interfere with verses that are in the normal learning process (e.g., interval 1, not yet “learned”).

***

## Planning steps you must perform

You are in planning mode. Before writing the final plan, you must:

1. **Inspect the data model**
   - Locate the file(s) that define the verse data structure (e.g., types, interfaces, or example JSON).
   - Identify:
     - How verses are represented in code.
     - How they are persisted (localStorage, backend, file export, etc.).
   - Propose a concrete extension for the second‑chance fields using the actual type names you find.

2. **Inspect review scheduling logic**
   - Find the code that handles:
     - Successful reviews.
     - Failed reviews.
     - Manual interval changes.
   - Identify:
     - Functions or services responsible for updating `interval`, `dueDate`, and `repetitions`.
     - Any existing “learning” vs “review” state distinctions.
   - Plan where to hook in:
     - The transition into second‑chance mode on first failure.
     - The logic that ignores interval changes while second‑chance is active.
     - The logic that applies the new interval on second‑chance success or restarts on second‑chance failure.

3. **Inspect ReviewSessions.svelte**
   - Determine:
     - How the list of verses is passed into the component.
     - How “due” status is computed.
     - How the “(Due in X hours)” message is currently generated and styled.
   - Plan:
     - A helper (function or derived value) to compute second‑chance status for a verse.
     - How to conditionally render the “(Second Chance …)” message instead of or in addition to the normal due message.
     - How to style this message consistently with the existing due label but visually distinct.

4. **Inspect the IndividualReview.svelte & SingleTextReview.svelte verse-displays**
   - Locate the component or file that contains the `verse-display` div.
   - Determine:
     - How the currently focused verse is passed into that component.
     - How classes or styles are currently bound to verse state.
   - Plan:
     - A conditional class (e.g., `is-second-chance`) on `verse-display` when the verse is in second‑chance mode.
     - CSS rules that set `border-color: var(--warning-color)` when that class is present.

5. **Inspect Settings.svelte**
   - Determine:
     - How settings are stored and updated.
     - The pattern used for other numeric or percentage settings.
   - Plan:
     - A new input field for “Second‑chance recovery percent”.
     - Validation/clamping logic.
     - How to propagate the updated setting to the review scheduling logic (e.g., via a store, context, or service).

6. **Inspect persistence and export**
   - Check how verse data and settings are saved/loaded (e.g., localStorage keys, API calls, export/import JSON).
   - Ensure:
     - The new second‑chance fields are included in persistence.
     - Existing exports/imports remain compatible or are versioned appropriately.

***

## Deliverable: Implementation plan

After performing the above inspections, produce a structured implementation plan that includes:

1. **Data model changes**
   - Exact fields to add to the verse type, with proposed names.
   - Where these fields will be stored and how they will be initialized for existing verses.

2. **Scheduling logic changes**
   - A list of functions/modules to modify or create, with responsibilities such as:
     - Entering second‑chance mode on first failure.
     - Ignoring interval updates while second‑chance is active.
     - Applying the recovery percent on second‑chance success.
     - Restarting the interval on second‑chance failure.
     - Clearing second‑chance state on manual interval change.
   - How the recovery percent setting will be passed into or accessed by this logic.

3. **Component changes**
   - `ReviewSessions.svelte`:
     - New helper(s) to compute second‑chance status.
     - Conditional rendering logic for the “(Second Chance …)” message.
     - Styling approach for the second‑chance label.
   - Verse display component:
     - How to add a conditional class to `verse-display`.
     - CSS changes to use `--warning-color` for the border when in second‑chance mode.
   - `Settings.svelte`:
     - New input field and validation logic.
     - How the setting is saved and made available to the scheduling logic.

4. **Persistence and migration**
   - How to ensure new fields are saved/loaded correctly.
   - Whether any migration is needed for existing verses (e.g., defaulting second‑chance fields to “inactive”).

5. **Testing checklist**
   - Scenarios to test, including:
     - First failure → second‑chance state created, interval unchanged.
     - Review before second‑chance due time → no interval change.
     - Second‑chance success → interval reduced by configured percent, state cleared.
     - Second‑chance failure → interval reset to 1, state cleared.
     - Manual interval change while in second‑chance → state cleared, interval updated.
     - UI: second‑chance label appears in `ReviewSessions.svelte`.
     - UI: `verse-display` border changes to `--warning-color` for second‑chance verses.
     - Settings: changing recovery percent affects subsequent second‑chance successes.

Do not write implementation code in this task. Your output should be a clear, step‑by‑step plan that another coding agent can follow to implement the feature, using the actual names and structures you discover in the codebase.