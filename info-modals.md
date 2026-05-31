#Info modals
- These modals are launched by the user clicking on a small svg icon
- This is the icon to use:
<svg class="activity-icon s-VogZgQW42wDz" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"></path><!----></svg>

##Add Verse Form
- Place the info modal icon in the Add verse header to the right of the centered h2 heading.
- Adapt the modal that was developed for the legacy app
- Use the current translations for chinese_verse_text, pinyin_initials_verse, zhuyin_initials_verse, and cangjie_initials_verse. Use the legacy translations for the other elements.
- Put an exit x in the top right corner
- Here is some of the relevant code from the legacy app

     // Update Add Verse tutorial example based on input method
      updateAddVerseTutorialExample();
    }
    
    function updateAddVerseTutorialExample() {
      const inputMethod = localStorage.getItem('inputMethod') || 'pinyin';
      const labelElement = document.getElementById('addVerseTutorialInputLabel');
      const initialsElement = document.getElementById('addVerseTutorialExampleInitials');
      
      if (!labelElement || !initialsElement) return;
      
      // Ephesians 2:8 verse: 你們得救是本乎恩，也因着信；這並不是出於自己，而是神所賜的；
      // Answer keys from sample files
      
      if (inputMethod === 'pinyin') {
        labelElement.setAttribute('data-i18n', 'pinyin_initials_verse');
        labelElement.textContent = t('pinyin_initials_verse');
        initialsElement.textContent = 'nmdjsbheyyzxzbbscyzjessscd';
      } else if (inputMethod === 'zhuyin') {
        labelElement.setAttribute('data-i18n', 'zhuyin_initials_verse');
        labelElement.textContent = t('zhuyin_initials_verse');
        initialsElement.textContent = 'ㄋㄇㄉㄐㄕㄅㄏㄣㄧㄧㄓㄒㄓㄅㄅㄕㄔㄩㄗㄐㄦㄕㄕㄙㄙㄉ';
      } else if (inputMethod === 'cangjie') {
        labelElement.setAttribute('data-i18n', 'cangjie_initials_verse');
        labelElement.textContent = t('cangjie_initials_verse');
        initialsElement.textContent = '人人竹戈日木竹田心田廿人卜廿一日山卜竹尸一日戈竹月竹';
      }
    }

const tutorialModal = document.getElementById('addVerseTutorialModal');
      tutorialModal.setAttribute('aria-hidden', 'false');
      tutorialModal.style.display = 'flex';
      return;
    }

<!-- Add Verse Tutorial Modal -->
<div id="addVerseTutorialModal" class="modal" aria-hidden="true">
  <div class="modal-overlay"></div>
  <div class="modal-content" role="dialog" aria-modal="true">
    <h2 id="addVerseTutorialTitle" data-i18n="add_verse_tutorial_title">How to Add Verses</h2>
    
    <div style="margin: 16px 0; line-height: 1.6;">
      <p id="addVerseTutorialDesc1" data-i18n="add_verse_tutorial_desc1">Verses are added manually so you can use any Bible translation you prefer. Simply copy and paste the Chinese text into the verse field.</p>
      
      <p id="addVerseTutorialDesc2" data-i18n="add_verse_tutorial_desc2" style="margin-top: 12px;">For the initials fields, type one key per character using your chosen input method. This creates the answer key you'll be graded against when learning and reviewing verses.</p>
    </div>
    
    <div style="margin: 20px 0; padding: 16px; background: var(--card-background); border-radius: 8px; border: 1px solid var(--border-color);">
      <h3 style="margin: 0 0 12px 0; font-size: var(--font-size-sm); color: var(--text-secondary);" data-i18n="add_verse_tutorial_example">Example: Ephesians 2:8</h3>
      
      <div style="margin-bottom: 12px;">
        <label style="font-size: var(--font-size-sm); font-weight: 600; color: var(--text-primary); text-align: left; display: block;" data-i18n="chinese_verse_text">Chinese Verse Text</label>
        <div id="addVerseTutorialExampleText" style="margin-top: 4px; padding: 8px; background: white; border: 1px solid #ddd; border-radius: 4px; font-size: var(--font-size-sm); color: #333; text-align: left;">
          你們得救是本乎恩，也因着信；這並不是出於自己，而是神所賜的；
        </div>
      </div>
      
      <div>
        <label id="addVerseTutorialInputLabel" data-i18n="pinyin_initials_verse" style="font-size: var(--font-size-sm); font-weight: 600; color: var(--text-primary); text-align: left; display: block;">Pinyin Initials for Verse</label>
        <div id="addVerseTutorialExampleInitials" style="margin-top: 4px; padding: 8px; background: white; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: var(--font-size-sm); color: #333; text-align: left;">
          nmdjsbheyyzxzbbscyzjessscd
        </div>
      </div>
      
      <p style="margin: 12px 0 0 0; font-size: var(--font-size-xs); color: var(--text-secondary); text-align: left;" id="addVerseTutorialNote">
        <strong>Note:</strong> <span data-i18n="add_verse_tutorial_note">Each Chinese character gets one key, punctuation is skipped.</span>
      </p>
    </div>
    
    <div class="onboarding-options">
      <button id="addVerseTutorialGotIt" class="onboarding-btn" data-i18n="got_it">Got it!</button>
    </div>
  </div>
</div>
<!-- End Add Verse Tutorial Modal -->

##Choose Review Mode
- Place the info modal icon in the bottom left corner of the modal.
###review_individually
- In this mode you will review the verses one at a time. You will enter the verse text followed by the verse reference.

###review_single_text
- In this mode you will review all of the verses as a single continuous text. You will only enter the verse text, the verse references will be filled in automatically.

##Select Activity (collection)
- Place the info modal icon in the bottom left corner of the practice panel below the grid of activities.
- Show the activity SVG Icon on the left and the description of that activity on the right.
- Put an exit x in the top right corner of this modal.
### speed_challenge_collection
- Recall the verses in this collection as fast as you can but be careful, because mistakes result in time penalties. Try to beat your fastest time.
### reference_quiz
- In this activity you are shown the verse text and asked to recall the verse reference. This activity is self-graded.
### reverse_by_verse
- This activity starts with entering the text for the last verse in the collection and then repeats with the last two verses, then the last three verses, and so on, working backwards until you recite the whole passage. Feel free to skip stages using the navigation arrows.
### first_and_last
- This activity asks you to enter only the first and last characters of each verse in the collection.

##Select Activity (verse)
- Place the info modal icon in the bottom left corner of the practice panel below the grid of activities.
- Show the activity SVG Icon on the left and the description of that activity on the right.
- Put an exit x in the top right corner of this modal.
###Classic
- This activity works just like the learn_mode but it does not affect review interval or heat maps.
###speed_challenge_verse
- Recall the verse text and verse reference as fast as you can but be careful, because mistakes result in time penalties. Try to beat your fastest time.
###Reverse
- This activity starts with entering the last character of the verse, then repeat with the last two characters, then the last three, and so on, working backwards until you recite the whole verse. Feel free to skip stages using the navigation arrows.
###blind_challenge
- This activity provides no absolutely no feedback until you submit your answer. Enter only the verse text and then click the submit button to see how you did.
