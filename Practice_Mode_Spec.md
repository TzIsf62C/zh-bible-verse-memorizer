```md
# Practice Component Spec

## Overview

The **Practice** component is a non-review mode for verse and collection exercises. It does not affect review intervals, scheduling, or heatArrays, and it is designed purely for skill-building and reinforcement. The activities themselves should also be developed as components in their own right.

## Entry Flow

Practice is entered from two top-level choices: “Practice a Collection” and “Practice a Verse.” After selection, the user chooses a specific collection or verse, then taps “Select Activity” to continue. Verse heatmaps also provide a “Practice Now” shortcut that routes directly into the verse activity picker with the corresponding verse preselected.

The component should support multiple activity types, each with its own input pattern and feedback behavior, while generally preserving the existing typing feedback model used elsewhere in the app.

### Flow Steps

1. User opens Practice.
2. User chooses either “Practice a Collection” or “Practice a Verse.”
3. User who selected "Practice a Collection" selects the target collection from a list of collections while user who selected "Practice a Verse" selects the target verse from a list of verses.
4. A bottom-fixed “Select Activity” button appears.
5. User selects an activity.
6. App launches the corresponding practice session component.

## Shared Behavior

All practice activities must:

- Avoid modifying review intervals.
- Avoid modifying heatArrays.
- Preserve existing input feedback conventions unless explicitly overridden.
- Support clear completion states and progression to the next prompt where applicable.

Collection-based activities may span multiple verses in sequence, while verse-based activities operate on a single verse only.

## Collection Activities

### Speed Challenge

Speed Challenge measures how fast the user can enter the verse text as a single continuous string, similar to SingleTextReview. Timing begins on the user’s first input and ends when the final character is entered. In response to user input, verse characters are displayed one at a time and colored for correctness, and the keyboard also reflects feedback.

When a verse is completed, the app should not pause for per-verse accuracy feedback. Instead, it should immediately reveal the next verse reference so the user can continue through the collection without interruption. At the end of the full collection, a finish modal shows raw time, penalty count, and official time, where official time equals raw time plus one second per penalty.

The app records a new best time only if the new official time is faster than the stored time. If the collection changes by adding or removing verses, any recorded time for that collection is reset.

### Reverse by Verse

Reverse by Verse is a progressive SingleTextReview that begins with the reference for the last verse in the collection. The user first types the initials for that verse. Once completed, a Next button appears at the bottom of the screen. Clicking next clears the verse display and loads the next subset of the collection (penultimate verse + final verse) and again the user types inputs, this time for both verses. This continues backward adding one verse at a time until the first verse in the collection has been added. That final state behaves exactly like the SingleTextReview.

Example progression:

- Verse 4.
- Verse 3 + Verse 4.
- Verse 2 + Verse 3 + Verse 4.
- Verse 1 + Verse 2 + Verse 3 + Verse 4.

Typing feedback should work the same way as in other modes, with colored text and keyboard feedback for incorrect input.

### First & Last

The app displays each verse reference one at a time. The user enters only the first and last characters of the verse text, while the middle portion is represented visually by a six-dot ellipsis. This activity is intended to strengthen recall of passage structure without requiring full-text typing.

### Reference Quiz

The app randomly selects a verse from the collection and displays only the verse text, without the reference. The user is challenged to remember the reference and clicks a button to reveal the answer. The app continues until every verse in the collection has been selected once, with no long-term data stored for this activity. 

## Verse Activities

### Classic

Classic behaves exactly like LearnFlow, allowing the user to switch between basic, intermediate, and advanced difficulty for already learned verses, but since this is a practice activity it does not affect review dates or the heat maps.

### Speed Challenge

This version of Speed Challenge is for a single verse and includes both verse text and verse reference. The user types the full answer as one continuous string, timing begins on first input, and the app records best performance if the new official time is better than the stored result. Typing feedback remains active throughout. Like the "Practice a Collection" version of the Speed Challenge, there is a raw time, penalty count, and official time, where official time equals raw time plus one second per penalty.

### Reverse

Reverse is a character-by-character backward build. The app shows the last character of the verse first, then the user enters the initial and the character changes color to provide feedback. Then after a short pause, the app shows the second-to-last character plus a blank, and the user types the initial for the shown character and also for the character represented by the blank. As input is typed the visible character changes color and the blank is replaced with a visible character (like intermediate difficulty LearningFlow). When all blanks have become characters, after a pause the third to last character is shown followed by two blanks. This continues until the full verse is reconstructed (Verse Reference + Verse Text). Feedback should remain color-coded for both text and keyboard input.

### Blind Challenge

Blind Challenge, displays the verse reference and prompts the user to enter the verse text. This activity hides character-level correctness until the full verse text is entered. Each typed character is represented onscreen as `* * * *`, while the keyboard gives feedback as though the input were correct so the user can keep their place. Once the final input matches the full expected verse length, the app reveals the complete verse text at once along with color-coded feedback and an accuracy score.

```