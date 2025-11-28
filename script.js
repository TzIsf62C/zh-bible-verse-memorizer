window.onload = function () {
  // DOM Elements
  const addVerseBtn = document.getElementById('addVerseBtn');
  const learnBtn = document.getElementById('learnBtn');
  const reviewBtn = document.getElementById('reviewBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const collectionsBtn = document.getElementById('collectionsBtn');
  const collectionsPanel = document.getElementById('collectionsPanel');
  const addVersePanel = document.getElementById('addVersePanel');
  const learnPanel = document.getElementById('learnPanel');
  const reviewPanel = document.getElementById('reviewPanel');
  const exportImportPanel = document.getElementById('exportImportPanel');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  const settingsSaveBtn = document.getElementById('settingsSaveBtn');
  const clearDataBtn = document.getElementById('clearDataBtn');
  const saveVerseBtn = document.getElementById('saveVerseBtn');
  const clearFormBtn = document.getElementById('clearFormBtn');
  const saveStatus = document.getElementById('saveStatus');
  const verseSelector = document.getElementById('verseSelector');
  const learnVerseDisplay = document.getElementById('learnVerseDisplay');
  const learnInput = document.getElementById('learnInput');
  const learnFeedback = document.getElementById('learnFeedback');
  const learnNextBtn = document.getElementById('learnNextBtn');
  const learnRetryBtn = document.getElementById('learnRetryBtn');
  const startReviewBtn = document.getElementById('startReviewBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const importDataBtn = document.getElementById('importDataBtn');
  const importFile = document.getElementById('importFile');
  const importFileName = document.getElementById('importFileName');
  const exportCollectionsSelect = document.getElementById('exportCollectionsSelect');
  const exportIncludeReview = document.getElementById('exportIncludeReview');
  const importIncludeReview = document.getElementById('importIncludeReview');
  const exportIncludeCollections = document.getElementById('exportIncludeCollections');
  const importIncludeCollections = document.getElementById('importIncludeCollections');
  const progressDisplay = document.getElementById('progressDisplay');
  const basicMode = document.getElementById('basicMode');
  const intermediateMode = document.getElementById('intermediateMode');
  const advancedMode = document.getElementById('advancedMode');
  const reviewModeHiddenControls = document.getElementById('reviewModeHiddenControls'); // NEW: For hiding learn mode controls during review
  // Collections DOM
  const newCollectionTitle = document.getElementById('newCollectionTitle');
  const createCollectionBtn = document.getElementById('createCollectionBtn');
  const collectionsList = document.getElementById('collectionsList');
  const collectionDetail = document.getElementById('collectionDetail');
  const collectionDetailTitle = document.getElementById('collectionDetailTitle');
  const addVerseToCollection = document.getElementById('addVerseToCollection');
  const addToCollectionBtn = document.getElementById('addToCollectionBtn');
  const collectionVerses = document.getElementById('collectionVerses');
  const reviewCollectionsList = document.getElementById('reviewCollectionsList');
  const reviewCollectionBtn = document.getElementById('reviewCollectionBtn');
  const addToCollectionSelect = document.getElementById('addToCollectionSelect');
  const addVerseList = document.getElementById('addVerseList');
  const reviewVerseList = document.getElementById('reviewVerseList');
  const bulkActions = document.getElementById('bulkActions');
  const bulkAddToCollectionBtn = document.getElementById('bulkAddToCollectionBtn');
  const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
  const bulkAddModal = document.getElementById('bulkAddModal');
  const bulkAddCollectionSelect = document.getElementById('bulkAddCollectionSelect');
  const bulkCreateNew = document.getElementById('bulkCreateNew');
  const bulkNewCollectionName = document.getElementById('bulkNewCollectionName');
  const bulkAddConfirmBtn = document.getElementById('bulkAddConfirmBtn');
  const bulkAddCancelBtn = document.getElementById('bulkAddCancelBtn');
  // --- ENHANCED BOOK DATA FOR PINYIN SEARCH ---
    // THEME MANAGEMENT
    function getSystemTheme() {
      try {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      } catch (e) { return 'dark'; }
    }

    function applyTheme(theme) {
      const t = theme === 'system' ? getSystemTheme() : theme;
      if (t === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        // dark mode: explicitly set to override system preference
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    }

    function initTheme() {
      const saved = localStorage.getItem('themePreference');
      const choice = saved || 'system';
      applyTheme(choice);
      // set radio state
      const radios = document.querySelectorAll('input[name="themeOption"]');
      radios.forEach(r => { r.checked = (r.value === choice); });
      // listen to system changes if using system
      try {
        if (!saved || saved === 'system') {
          const mq = window.matchMedia('(prefers-color-scheme: light)');
          mq.addEventListener('change', () => applyTheme('system'));
        }
      } catch (e) { /* ignore */ }
    }

    initTheme();

    // LANGUAGE MANAGEMENT SYSTEM
    const TRANSLATIONS = {
      english: {
        app_title: "ZH Bible Verse Memorizer",
        app_title_chinese: "圣经经文背诵",
        language_label: "Language",
        lang_english: "English",
        lang_simplified: "Simplified",
        lang_traditional: "Traditional",
        // Navigation
        settings: "Settings",
        add_verse: "Add Verse",
        learn: "Learn",
        collections: "Collections",
        review: "Review",
        export_import: "Export & Import",
        // Theme
        theme: "Theme",
        theme_system: "System",
        theme_light: "Light",
        theme_dark: "Dark",
        default_bible_version: "Default Bible Version",
        save_settings: "Save Settings",
        // Add Verse Panel
        add_verse_title: "Add Verse",
        chinese_verse_text: "Chinese Verse Text",
        chinese_book_name: "Chinese Book Name",
        chapter: "Chapter",
        verse: "Verse",
        pinyin_initials_verse: "Pinyin Initials for Verse",
        pinyin_helper: "Type the first letter of each character's pinyin",
        pinyin_initials_book: "Pinyin Initials for Book Name",
        bible_version_optional: "Bible version (optional)",
        add_to_collection_optional: "Add to collection (optional)",
        none: "(none)",
        save_verse: "Save Verse",
        update_verse: "Update Verse",
        clear_form: "Clear Form",
        edit: "Edit",
        delete: "Delete",
        add_selected_to_collection: "Add selected to collection",
        delete_selected: "Delete selected",
        // Learn Panel
        learn_mode: "Learn Mode",
        basic: "Basic",
        intermediate: "Intermediate",
        advanced: "Advanced",
        select_verse: "Select Verse",
        sound_off: "Sound Off",
        sound_on: "Sound On",
        toggle_sound: "Toggle sound",
        retry: "Retry",
        next: "Next",
        finish: "Finish",
        // Review Panel
        review_mode: "Review Mode",
        select_collection: "Select a collection",
        review_collection_learned: "Review Collection (learned only)",
        or_select_individual: "Or select individual verses",
        review_verses: "Review verses",
        choose_review_mode: "Choose Review Mode",
        review_individually: "Review verses individually",
        review_single_text: "Review as a single text",
        // Collections Panel
        collections_title: "Collections",
        new_collection_title: "New Collection Title",
        create_collection: "Create Collection",
        view: "View",
        rename: "Rename",
        add: "Add",
        remove: "Remove",
        // Export/Import Panel
        export_import_title: "Export & Import",
        select_export: "Select what to export",
        all_verses: "All verses",
        not_in_collection: "Not in a collection",
        include_review_data: "Include review data (last reviewed, due dates)",
        include_collection_data: "Include collection data (titles, verse order)",
        import_review_data: "Import review data (last reviewed, due dates)",
        import_collection_data: "Import collection data (titles, verse order)",
        download_data: "Download Data",
        import_data: "Import Data",
        choose_file: "Choose File",
        no_file_selected: "No file selected",
        // Bulk Actions
        confirm: "Confirm",
        cancel: "Cancel",
        choose_collection: "Choose collection",
        new_collection_name: "New collection name",
        // Common
        last_reviewed: "Last reviewed",
        not_reviewed_yet: "Not reviewed yet",
        days_ago: "days ago",
        due_in_days: "Due in {count} days",
        due_in_hours: "Due in {count} hours",
        due_in_hour: "Due in 1 hour",
        due_today: "Due today",
        days_overdue: "{count} days overdue",
        day: "day",
        days: "days",
        hour: "hour",
        hours: "hours",
        learned: "learned",
        verses: "verses",
        result: "Result",
        accuracy: "Accuracy",
        incorrect_input: "Incorrect input for \"{char}\" (position {pos}). Expected \"{expected}\".",
        due_count: "{count} due",
        learned_count: "{count} learned",
        // Messages
        no_verses_to_learn: "No new verses to learn.",
        no_learned_verses: "No learned verses to review",
        no_learned_verses_collection: "No learned verses in this collection",
        no_collections: "No collections available",
        select_at_least_one: "Please select at least one verse",
        select_verse_to_review: "Please select at least one verse to review",
        select_collection_to_review: "Please select a collection to review",
        delete_confirmation: "Are you sure you want to delete this verse?",
        delete_collection_confirmation: "Delete this collection?",
        delete_selected_confirmation: "Delete selected verses?",
        delete_count_confirmation: "Delete {count} selected verses?",
        enter_title: "Please enter a title",
        enter_collection_name: "Enter a new collection name",
        select_collection_msg: "Select a collection to add to",
        select_or_create_collection: "Please choose or create a collection",
        collection_not_found: "Collection not found",
        verses_added_to_collection: "Added selected verses to collection",
        completed_all_verses: "Congratulations! You have completed all new verses.",
        select_file_to_import: "Please select a file to import",
        import_successful: "Import successful",
        error_importing: "Error importing file",
        congratulations_mastered: "Congratulations you have mastered this verse!",
        great_job_continue: "Great job! Let's continue with the next verse.",
        great_job_intermediate: "Great job! You can recite it with hints, now let's master it.",
        great_job_basic: "Great job! Now that you're familiar with this verse, try to Memorize it.",
        nice_try: "Nice Try! Aim for greater than 90%",
        congratulations_reviewed: "Congratulations, you have reviewed",
        congratulations_reviewed_count: "Congratulations! You have successfully reviewed {count} verses!",
        fill_all_fields: "Please fill in all fields completely.",
        chapter_verse_numbers: "Chapter and Verse must be numbers.",
        verse_saved: "Verse saved!",
        verse_updated: "Verse updated!",
        reset_review_data_title: "Reset Review Data?",
        reset_review_data_message: "This verse has existing review history. Would you like to reset the review data?",
        yes: "Yes",
        no: "No",
        clear_all_data: "Clear All Data",
        clear_data_warning: "This will permanently delete all verses, collections, and review data from this device.",
        clear_all_data_btn: "Clear All Data",
        clear_data_confirm: "Are you sure you want to clear all data?\n\nThis will permanently delete:\n• All verses\n• All collections\n• All review progress\n• All settings\n\nThis action cannot be undone."
      },
      simplified: {
        app_title: "ZH Bible Verse Memorizer",
        app_title_chinese: "圣经经文背诵",
        language_label: "Language / 语言",
        lang_english: "English / 英文",
        lang_simplified: "Simplified / 简体",
        lang_traditional: "Traditional / 繁體",
        // Navigation
        settings: "设置",
        add_verse: "添加经文",
        learn: "学习",
        collections: "集合",
        review: "复习",
        export_import: "导出导入",
        // Theme
        theme: "主题",
        theme_system: "系统",
        theme_light: "亮色",
        theme_dark: "暗色",
        default_bible_version: "默认圣经版本",
        save_settings: "Save Settings / 保存设置",
        // Add Verse Panel
        add_verse_title: "添加经文",
        chinese_verse_text: "中文经文",
        chinese_book_name: "中文书名",
        chapter: "章号",
        verse: "节号",
        pinyin_initials_verse: "经文拼音首字母",
        pinyin_helper: "输入每个汉字拼音的首字母",
        pinyin_initials_book: "书名拼音首字母",
        bible_version_optional: "圣经版本（可选）",
        add_to_collection_optional: "可选：加入集合",
        none: "无",
        save_verse: "保存经文",
        update_verse: "更新经文",
        clear_form: "清空表单",
        edit: "编辑",
        delete: "删除",
        add_selected_to_collection: "将所选添加到集合",
        delete_selected: "删除所选",
        // Learn Panel
        learn_mode: "学习模式",
        basic: "基础",
        intermediate: "中级",
        advanced: "高级",
        select_verse: "选择经文",
        sound_off: "静音",
        sound_on: "有声音",
        toggle_sound: "切换声音",
        retry: "重试",
        next: "继续",
        finish: "完成",
        // Review Panel
        review_mode: "复习模式",
        select_collection: "选择一个集合",
        review_collection_learned: "复习集合（仅已学习）",
        or_select_individual: "或选择单个经文",
        review_verses: "开始复习经文",
        choose_review_mode: "选择复习方式",
        review_individually: "逐节复习",
        review_single_text: "单段复习",
        // Collections Panel
        collections_title: "经文集合",
        new_collection_title: "新集合标题",
        create_collection: "新建集合",
        view: "查看",
        rename: "重命名",
        add: "添加",
        remove: "移除",
        // Export/Import Panel
        export_import_title: "导出导入",
        select_export: "选择要导出的内容",
        all_verses: "所有经文",
        not_in_collection: "未分组",
        include_review_data: "包含复习数据",
        include_collection_data: "包含集合数据",
        import_review_data: "导入复习数据",
        import_collection_data: "导入集合数据",
        download_data: "下载数据",
        import_data: "导入数据",
        choose_file: "选择文件",
        no_file_selected: "未选择文件",
        // Bulk Actions
        confirm: "确定",
        cancel: "取消",
        choose_collection: "选择集合",
        new_collection_name: "新集合名称",
        // Common
        last_reviewed: "上次复习",
        not_reviewed_yet: "尚未复习",
        days_ago: "天前",
        due_in_days: "{count} 天后到期",
        due_in_hours: "{count} 小时后到期",
        due_in_hour: "1 小时后到期",
        due_today: "今天到期",
        days_overdue: "{count} 天逾期",
        day: "天",
        days: "天",
        hour: "小时",
        hours: "小时",
        learned: "已学习",
        verses: "节",
        result: "结果",
        accuracy: "正确率",
        incorrect_input: "在\"{char}\"处输入错误（第{pos}个），应该是\"{expected}\"。",
        due_count: "{count} 个待复习",
        learned_count: "{count} 已学习",
        // Messages
        no_verses_to_learn: "您已学习完所有未学习的经文。",
        no_learned_verses: "暂无已学习的经文",
        no_learned_verses_collection: "此集合中没有已学习的经文",
        no_collections: "暂无集合",
        select_at_least_one: "请选择至少一节经文",
        select_verse_to_review: "请选择至少一节经文复习",
        select_collection_to_review: "请选择一个集合进行复习",
        delete_confirmation: "您确定要删除这节经文吗？",
        delete_collection_confirmation: "删除此集合吗？",
        delete_selected_confirmation: "删除所选经文？",
        delete_count_confirmation: "删除所选 {count} 节经文？",
        enter_title: "请输入标题",
        enter_collection_name: "请输入集合名称",
        select_collection_msg: "请选择一个集合",
        select_or_create_collection: "请选择或创建集合",
        collection_not_found: "未找到集合",
        verses_added_to_collection: "已将所选经文添加到集合",
        completed_all_verses: "恭喜！您已完成所有新经文。",
        select_file_to_import: "请选择要导入的文件",
        import_successful: "导入成功",
        error_importing: "导入文件时出错",
        congratulations_mastered: "恭喜，您已掌握此经文！",
        great_job_continue: "做得好！让我们继续复习下一节。",
        great_job_intermediate: "做得好！现在您可以在带提示的情况下朗诵，接下来让我们熟练掌握它。",
        great_job_basic: "做得好！既然您对这节经文已有熟悉，可以尝试背诵它。",
        nice_try: "差一点就成功了！目标是超过90%",
        congratulations_reviewed: "恭喜！你已成功複習了",
        congratulations_reviewed_count: "恭喜！你已成功複習了 {count} 節經文！",
        fill_all_fields: "请输入完整的经文各项内容。",
        chapter_verse_numbers: "章节和节号必须是数字。",
        verse_saved: "经文已保存！",
        verse_updated: "经文已更新！",
        reset_review_data_title: "重置复习数据？",
        reset_review_data_message: "此经文已有复习记录。您想重置复习数据吗？",
        yes: "是",
        no: "否",
        clear_all_data: "清除所有数据",
        clear_data_warning: "这将永久删除此设备上的所有经文、集合和复习数据。",
        clear_all_data_btn: "清除所有数据",
        clear_data_confirm: "您确定要清除所有数据吗？\n\n这将永久删除：\n• 所有经文\n• 所有集合\n• 所有复习进度\n• 所有设置\n\n此操作无法撤消。"
      },
      traditional: {
        app_title: "ZH Bible Verse Memorizer",
        app_title_chinese: "聖經經文背誦",
        language_label: "Language / 語言",
        lang_english: "English / 英文",
        lang_simplified: "Simplified / 簡體",
        lang_traditional: "Traditional / 繁體",
        // Navigation
        settings: "設置",
        add_verse: "添加經文",
        learn: "學習",
        collections: "集合",
        review: "複習",
        export_import: "導出導入",
        // Theme
        theme: "主題",
        theme_system: "系統",
        theme_light: "亮色",
        theme_dark: "暗色",
        default_bible_version: "默認聖經版本",
        save_settings: "Save Settings / 保存設置",
        // Add Verse Panel
        add_verse_title: "添加經文",
        chinese_verse_text: "中文經文",
        chinese_book_name: "中文書名",
        chapter: "章號",
        verse: "節號",
        pinyin_initials_verse: "經文拼音首字母",
        pinyin_helper: "輸入每個漢字拼音的首字母",
        pinyin_initials_book: "書名拼音首字母",
        bible_version_optional: "聖經版本（可選）",
        add_to_collection_optional: "可選：加入集合",
        none: "無",
        save_verse: "保存經文",
        update_verse: "更新經文",
        clear_form: "清空表單",
        edit: "編輯",
        delete: "刪除",
        add_selected_to_collection: "將所選添加到集合",
        delete_selected: "刪除所選",
        // Learn Panel
        learn_mode: "學習模式",
        basic: "基礎",
        intermediate: "中級",
        advanced: "高級",
        select_verse: "選擇經文",
        sound_off: "靜音",
        sound_on: "有聲音",
        toggle_sound: "切換聲音",
        retry: "重試",
        next: "繼續",
        finish: "完成",
        // Review Panel
        review_mode: "複習模式",
        select_collection: "選擇一個集合",
        review_collection_learned: "複習集合（僅已學習）",
        or_select_individual: "或選擇單個經文",
        review_verses: "開始複習經文",
        choose_review_mode: "選擇複習方式",
        review_individually: "逐節複習",
        review_single_text: "單段複習",
        // Collections Panel
        collections_title: "經文集合",
        new_collection_title: "新集合標題",
        create_collection: "新建集合",
        view: "查看",
        rename: "重命名",
        add: "添加",
        remove: "移除",
        // Export/Import Panel
        export_import_title: "導出導入",
        select_export: "選擇要導出的內容",
        all_verses: "所有經文",
        not_in_collection: "未分組",
        include_review_data: "包含複習數據",
        include_collection_data: "包含集合數據",
        import_review_data: "導入複習數據",
        import_collection_data: "導入集合數據",
        download_data: "下載數據",
        import_data: "導入數據",
        choose_file: "選擇文件",
        no_file_selected: "未選擇文件",
        // Bulk Actions
        confirm: "確定",
        cancel: "取消",
        choose_collection: "選擇集合",
        new_collection_name: "新集合名稱",
        // Common
        last_reviewed: "上次複習",
        not_reviewed_yet: "尚未複習",
        days_ago: "天前",
        due_in_days: "{count} 天後到期",
        due_in_hours: "{count} 小時後到期",
        due_in_hour: "1 小時後到期",
        due_today: "今天到期",
        days_overdue: "{count} 天逾期",
        day: "天",
        days: "天",
        hour: "小時",
        hours: "小時",
        learned: "已學習",
        verses: "節",
        result: "結果",
        accuracy: "正確率",
        incorrect_input: "在\"{char}\"處輸入錯誤（第{pos}個），應該是\"{expected}\"。",
        due_count: "{count} 個待複習",
        learned_count: "{count} 已學習",
        // Messages
        no_verses_to_learn: "您已學習完所有未學習的經文。",
        no_learned_verses: "暫無已學習的經文",
        no_learned_verses_collection: "此集合中沒有已學習的經文",
        no_collections: "暫無集合",
        select_at_least_one: "請選擇至少一節經文",
        select_verse_to_review: "請選擇至少一節經文複習",
        select_collection_to_review: "請選擇一個集合進行複習",
        delete_confirmation: "您確定要刪除這節經文嗎？",
        delete_collection_confirmation: "刪除此集合嗎？",
        delete_selected_confirmation: "刪除所選經文？",
        delete_count_confirmation: "刪除所選 {count} 節經文？",
        enter_title: "請輸入標題",
        enter_collection_name: "請輸入集合名稱",
        select_collection_msg: "請選擇一個集合",
        select_or_create_collection: "請選擇或創建集合",
        collection_not_found: "未找到集合",
        verses_added_to_collection: "已將所選經文添加到集合",
        completed_all_verses: "恭喜！您已完成所有新經文。",
        select_file_to_import: "請選擇要導入的文件",
        import_successful: "導入成功",
        error_importing: "導入文件時出錯",
        congratulations_mastered: "恭喜，您已掌握此經文！",
        great_job_continue: "做得好！讓我們繼續複習下一節。",
        great_job_intermediate: "做得好！現在您可以在帶提示的情況下朗誦，接下來讓我們熟練掌握它。",
        great_job_basic: "做得好！既然您對這節經文已有熟悉，可以嘗試背誦它。",
        nice_try: "差一點就成功了！目標是超過90%",
        congratulations_reviewed: "恭喜！你已成功複習了",
        congratulations_reviewed_count: "恭喜！你已成功複習了 {count} 節經文！",
        fill_all_fields: "請輸入完整的經文各項內容。",
        chapter_verse_numbers: "章節和節號必須是數字。",
        verse_saved: "經文已保存！",
        verse_updated: "經文已更新！",
        reset_review_data_title: "重置複習數據？",
        reset_review_data_message: "此經文已有複習記錄。您想重置複習數據嗎？",
        yes: "是",
        no: "否",
        clear_all_data: "清除所有數據",
        clear_data_warning: "這將永久刪除此設備上的所有經文、集合和複習數據。",
        clear_all_data_btn: "清除所有數據",
        clear_data_confirm: "您確定要清除所有數據嗎？\n\n這將永久刪除：\n• 所有經文\n• 所有集合\n• 所有複習進度\n• 所有設置\n\n此操作無法撤消。"
      }
    };

    function t(key, lang) {
      const savedLang = lang || localStorage.getItem('languagePreference') || 'english';
      return TRANSLATIONS[savedLang][key] || key;
    }

    function applyLanguage(lang) {
      const savedLang = lang || localStorage.getItem('languagePreference') || 'english';
      
      // Apply title - always English + Chinese, but Chinese changes based on traditional setting
      const h1 = document.querySelector('h1');
      if (h1) {
        const chineseTitle = savedLang === 'traditional' ? 
          TRANSLATIONS.traditional.app_title_chinese : 
          TRANSLATIONS.simplified.app_title_chinese;
        h1.innerHTML = `${TRANSLATIONS[savedLang].app_title}<br>${chineseTitle}`;
      }

      // Apply language setting labels (special handling)
      document.querySelectorAll('[data-i18n-special]').forEach(el => {
        const key = el.getAttribute('data-i18n-special');
        if (savedLang === 'english') {
          el.textContent = TRANSLATIONS.english[key];
        } else {
          el.textContent = TRANSLATIONS[savedLang][key];
        }
      });

      // Apply all other translations (single language)
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        // Special handling for Review button to preserve badge
        if (el.id === 'reviewBtn') {
          const badge = el.querySelector('#reviewBadge');
          el.textContent = t(key, savedLang);
          if (badge) {
            el.appendChild(badge); // Re-append the badge after setting text
          }
        } else {
          el.textContent = t(key, savedLang);
        }
      });
    }

    function initLanguage() {
      const saved = localStorage.getItem('languagePreference');
      let choice;
      
      if (saved) {
        // Use saved preference
        choice = saved;
      } else {
        // Detect system language on first visit
        const systemLang = navigator.language || navigator.userLanguage;
        
        if (systemLang.startsWith('zh-Hans') || systemLang.startsWith('zh-CN') || systemLang === 'zh-SG') {
          // Simplified Chinese regions
          choice = 'simplified';
        } else if (systemLang.startsWith('zh-Hant') || systemLang.startsWith('zh-TW') || systemLang.startsWith('zh-HK') || systemLang.startsWith('zh-MO')) {
          // Traditional Chinese regions
          choice = 'traditional';
        } else if (systemLang.startsWith('zh')) {
          // Generic Chinese, default to simplified
          choice = 'simplified';
        } else {
          // Default to English for all other languages
          choice = 'english';
        }
      }
      
      applyLanguage(choice);
      const radios = document.querySelectorAll('input[name="languageOption"]');
      radios.forEach(r => { r.checked = (r.value === choice); });
    }

    initLanguage();

    // Settings panel handlers
    if (settingsBtn && settingsPanel) {
      settingsBtn.addEventListener('click', () => {
        showPanel(settingsPanel);
        // Load default Bible version from localStorage
        const defaultBibleVersionInput = document.getElementById('defaultBibleVersion');
        if (defaultBibleVersionInput) {
          defaultBibleVersionInput.value = localStorage.getItem('defaultBibleVersion') || '';
        }
      });
    }
    if (settingsSaveBtn && settingsPanel) {
      settingsSaveBtn.addEventListener('click', () => {
        const selectedTheme = document.querySelector('input[name="themeOption"]:checked');
        const themeVal = selectedTheme ? selectedTheme.value : 'system';
        localStorage.setItem('themePreference', themeVal);
        applyTheme(themeVal);
        
        const selectedLang = document.querySelector('input[name="languageOption"]:checked');
        const langVal = selectedLang ? selectedLang.value : 'english';
        const previousLang = localStorage.getItem('languagePreference');
        localStorage.setItem('languagePreference', langVal);
        applyLanguage(langVal);
        
        // Save default Bible version
        const defaultBibleVersionInput = document.getElementById('defaultBibleVersion');
        if (defaultBibleVersionInput) {
          localStorage.setItem('defaultBibleVersion', defaultBibleVersionInput.value.trim());
        }
        
        // If language changed, rebuild bible books and refresh displays
        if (previousLang !== langVal) {
          rebuildBibleBooks();
          loadVersesForEdit();
          loadVersesForReview();
          loadCollectionsForReview();
          populateCollectionSelector();
        }
      });
    }

    // Clear All Data button handler
    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', () => {
        const currentLang = localStorage.getItem('languagePreference') || 'english';
        const confirmMessage = t('clear_data_confirm', currentLang);
        
        if (confirm(confirmMessage)) {
          // Clear all localStorage data
          localStorage.clear();
          
          // Reload the page to reset the app
          window.location.reload();
        }
      });
    }

  // --- BIBLE BOOKS DATA WITH SIMPLIFIED AND TRADITIONAL ---
  const BIBLE_BOOKS_DATA = [
    { simplified: "创世记", traditional: "創世記", pinyin: "chuangshiji", initials: "CSJ" },
    { simplified: "出埃及记", traditional: "出埃及記", pinyin: "chuaiaijiji", initials: "CAJJ" },
    { simplified: "利未记", traditional: "利未記", pinyin: "liweiji", initials: "LWJ" },
    { simplified: "民数记", traditional: "民數記", pinyin: "minshuji", initials: "MSJ" },
    { simplified: "申命记", traditional: "申命記", pinyin: "shenmingji", initials: "SMJ" },
    { simplified: "约书亚记", traditional: "約書亞記", pinyin: "yueshuji", initials: "YSYJ" },
    { simplified: "士师记", traditional: "士師記", pinyin: "shishiji", initials: "SSJ" },
    { simplified: "路得记", traditional: "路得記", pinyin: "ludeji", initials: "LDJ" },
    { simplified: "撒母耳记上", traditional: "撒母耳記上", pinyin: "samuerjishang", initials: "SMEJS" },
    { simplified: "撒母耳记下", traditional: "撒母耳記下", pinyin: "samuerjixia", initials: "SMEJX" },
    { simplified: "列王纪上", traditional: "列王紀上", pinyin: "liewangjishang", initials: "LWJS" },
    { simplified: "列王纪下", traditional: "列王紀下", pinyin: "liewangjixia", initials: "LWJX" },
    { simplified: "历代志上", traditional: "歷代志上", pinyin: "lidaizhishang", initials: "LDZS" },
    { simplified: "历代志下", traditional: "歷代志下", pinyin: "lidaizhixia", initials: "LDZX" },
    { simplified: "以斯拉记", traditional: "以斯拉記", pinyin: "yisilaji", initials: "YSLJ" },
    { simplified: "尼希米记", traditional: "尼希米記", pinyin: "niximiji", initials: "NXMJ" },
    { simplified: "以斯帖记", traditional: "以斯帖記", pinyin: "yisitiejie", initials: "YSTJ" },
    { simplified: "约伯记", traditional: "約伯記", pinyin: "yueboji", initials: "YBJ" },
    { simplified: "诗篇", traditional: "詩篇", pinyin: "shipian", initials: "SP" },
    { simplified: "箴言", traditional: "箴言", pinyin: "zhenyan", initials: "ZY" },
    { simplified: "传道书", traditional: "傳道書", pinyin: "chuandaoshu", initials: "CDS" },
    { simplified: "雅歌", traditional: "雅歌", pinyin: "yage", initials: "YG" },
    { simplified: "以赛亚书", traditional: "以賽亞書", pinyin: "yisaiyashu", initials: "YSYS" },
    { simplified: "耶利米书", traditional: "耶利米書", pinyin: "yelimishu", initials: "YLMS" },
    { simplified: "耶利米哀歌", traditional: "耶利米哀歌", pinyin: "yelimiaige", initials: "YLMAG" },
    { simplified: "以西结书", traditional: "以西結書", pinyin: "yixiejieshu", initials: "YXJS" },
    { simplified: "但以理书", traditional: "但以理書", pinyin: "danyilishu", initials: "DYLS" },
    { simplified: "何西阿书", traditional: "何西阿書", pinyin: "hexiaoshu", initials: "HXAS" },
    { simplified: "约珥书", traditional: "約珥書", pinyin: "yuerhushu", initials: "YES" },
    { simplified: "阿摩司书", traditional: "阿摩司書", pinyin: "amosishu", initials: "AMSS" },
    { simplified: "俄巴底亚书", traditional: "俄巴底亞書", pinyin: "ebadiyashu", initials: "EBDYS" },
    { simplified: "约拿书", traditional: "約拿書", pinyin: "yuonashu", initials: "YNS" },
    { simplified: "弥迦书", traditional: "彌迦書", pinyin: "mijiashu", initials: "MJS" },
    { simplified: "那鸿书", traditional: "那鴻書", pinyin: "nahongshu", initials: "NHS" },
    { simplified: "哈巴谷书", traditional: "哈巴谷書", pinyin: "habagushu", initials: "HBGS" },
    { simplified: "西番雅书", traditional: "西番雅書", pinyin: "xifanyashu", initials: "XFYS" },
    { simplified: "哈该书", traditional: "哈該書", pinyin: "hagaishu", initials: "HGS" },
    { simplified: "撒迦利亚书", traditional: "撒迦利亞書", pinyin: "sajialiyashu", initials: "SJLYS" },
    { simplified: "玛拉基书", traditional: "瑪拉基書", pinyin: "malajishu", initials: "MLJS" },
    { simplified: "马太福音", traditional: "馬太福音", pinyin: "mataifuyin", initials: "MTFY" },
    { simplified: "马可福音", traditional: "馬可福音", pinyin: "makefuyin", initials: "MKFY" },
    { simplified: "路加福音", traditional: "路加福音", pinyin: "lujiafuyin", initials: "LJFY" },
    { simplified: "约翰福音", traditional: "約翰福音", pinyin: "yuohanfuyin", initials: "YHFY" },
    { simplified: "使徒行传", traditional: "使徒行傳", pinyin: "shiduhangzhuan", initials: "STXZ" },
    { simplified: "罗马书", traditional: "羅馬書", pinyin: "luomashu", initials: "LMS" },
    { simplified: "哥林多前书", traditional: "哥林多前書", pinyin: "gelinduoqianshu", initials: "GLDQS" },
    { simplified: "哥林多后书", traditional: "哥林多後書", pinyin: "gelinduohoushu", initials: "GLDHS" },
    { simplified: "加拉太书", traditional: "加拉太書", pinyin: "jialataishu", initials: "JLTS" },
    { simplified: "以弗所书", traditional: "以弗所書", pinyin: "yifuosuoshu", initials: "YFSS" },
    { simplified: "腓立比书", traditional: "腓立比書", pinyin: "feilibishu", initials: "FLBS" },
    { simplified: "歌罗西书", traditional: "歌羅西書", pinyin: "geluoxishu", initials: "GLXS" },
    { simplified: "帖撒罗尼迦前书", traditional: "帖撒羅尼迦前書", pinyin: "tiesaluonijiaqianshu", initials: "TSLNJQS" },
    { simplified: "帖撒罗尼迦后书", traditional: "帖撒羅尼迦後書", pinyin: "tiesaluonijiahoushu", initials: "TSLNJHS" },
    { simplified: "提摩太前书", traditional: "提摩太前書", pinyin: "timotaiqianshu", initials: "TMTQS" },
    { simplified: "提摩太后书", traditional: "提摩太後書", pinyin: "timotaihoushu", initials: "TMTHS" },
    { simplified: "提多书", traditional: "提多書", pinyin: "tiduoshu", initials: "TDS" },
    { simplified: "腓利门书", traditional: "腓利門書", pinyin: "feilimenshu", initials: "FLMS" },
    { simplified: "希伯来书", traditional: "希伯來書", pinyin: "xibolaishu", initials: "XBLS" },
    { simplified: "雅各书", traditional: "雅各書", pinyin: "yageshu", initials: "YGS" },
    { simplified: "彼得前书", traditional: "彼得前書", pinyin: "bideqianshu", initials: "BDQS" },
    { simplified: "彼得后书", traditional: "彼得後書", pinyin: "bidehoushu", initials: "BDHS" },
    { simplified: "约翰壹书", traditional: "約翰壹書", pinyin: "yuohanyishu", initials: "YHYS" },
    { simplified: "约翰贰书", traditional: "約翰貳書", pinyin: "yuohanershu", initials: "YHES" },
    { simplified: "约翰参书", traditional: "約翰參書", pinyin: "yuohansanshu", initials: "YHSS" },
    { simplified: "犹大书", traditional: "猶大書", pinyin: "youdashu", initials: "YDS" },
    { simplified: "启示录", traditional: "啟示錄", pinyin: "qishilu", initials: "QSL" }
  ];
  
  // CHINESE_BIBLE_BOOKS maintains compatibility: books display in current language setting, but remain Chinese
  let CHINESE_BIBLE_BOOKS = BIBLE_BOOKS_DATA.map(b => {
    const lang = localStorage.getItem('languagePreference') || 'english';
    return {
      hanzi: lang === 'traditional' ? b.traditional : b.simplified,
      pinyin: b.pinyin,
      initials: b.initials
    };
  });

  // Function to rebuild CHINESE_BIBLE_BOOKS when language changes
  function rebuildBibleBooks() {
    const lang = localStorage.getItem('languagePreference') || 'english';
    CHINESE_BIBLE_BOOKS = BIBLE_BOOKS_DATA.map(b => {
      return {
        hanzi: lang === 'traditional' ? b.traditional : b.simplified,
        pinyin: b.pinyin,
        initials: b.initials
      };
    });
  }

  const bookNameInput = document.getElementById('bookNameInput');
  const bookSuggestions = document.getElementById('bookSuggestions');

  // Helper function to get the order of a book in the Bible
  function getBookOrder(bookName) {
    const index = CHINESE_BIBLE_BOOKS.findIndex(b => b.hanzi === bookName);
    return index !== -1 ? index : 999; // Return 999 for unknown books to sort them last
  }

  // Helper function to sort verses by Bible book order, chapter, and verse
  function sortVersesByBibleOrder(verses) {
    return verses.sort((a, b) => {
      // First compare by book order
      const bookOrderA = getBookOrder(a.bookName);
      const bookOrderB = getBookOrder(b.bookName);
      if (bookOrderA !== bookOrderB) return bookOrderA - bookOrderB;
      
      // Then by chapter number
      const chapterA = parseInt(a.chapterNumber) || 0;
      const chapterB = parseInt(b.chapterNumber) || 0;
      if (chapterA !== chapterB) return chapterA - chapterB;
      
      // Finally by verse number
      const verseA = parseInt(a.verseNumber) || 0;
      const verseB = parseInt(b.verseNumber) || 0;
      return verseA - verseB;
    });
  }
 // --- NEW: Pinyin Autocomplete Logic ---
    
  // Function to render the suggestions based on input value
  function updateSuggestions() {
    const query = bookNameInput.value.trim().toLowerCase();
    bookSuggestions.innerHTML = ''; // Clear previous suggestions

    let booksToDisplay = [];
    const MAX_FILTERED_RESULTS = 20; // Maximum results when actively typing

    // Condition 1: If the query is empty, show the entire list for browsing.
    if (query.length === 0) {
        // Show ALL books (no limit applied)
        booksToDisplay = CHINESE_BIBLE_BOOKS; 
    } else {
        // Condition 2: If there is a query, filter the list and limit the results.
        booksToDisplay = CHINESE_BIBLE_BOOKS.filter(book => 
            // Match against Hanzi or Pinyin (case-insensitive)
            book.hanzi.includes(query) || book.pinyin.includes(query.replace(/\s/g, ''))
        ).slice(0, MAX_FILTERED_RESULTS); // Apply the limit here
    }
    
    // The list to be rendered is either the full list or the top 20 matches
    const finalBooks = booksToDisplay; 

    if (finalBooks.length > 0) {
        finalBooks.forEach(book => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = book.hanzi;
            item.dataset.bookName = book.hanzi;
            // NEW: Store the initials in a data attribute
            item.dataset.bookInitials = book.initials; 

            // Click handler to select the suggestion
            item.addEventListener('click', () => {
                // 1. Fill the Book Name input
                bookNameInput.value = item.dataset.bookName;
                
                // 2. NEW: Automatically fill the Book Initials input
                const bookInitialsInput = document.getElementById('bookInitials'); // Assumes this is the correct ID
                if (bookInitialsInput) {
                    bookInitialsInput.value = item.dataset.bookInitials;
                }

                bookSuggestions.style.display = 'none'; // Hide suggestions after selection
            });
            
            bookSuggestions.appendChild(item);
        });
        bookSuggestions.style.display = 'block';
    } else {
        bookSuggestions.style.display = 'none';
    }
  }

    // Add event listener to the input field
    if (bookNameInput) {
        bookNameInput.addEventListener('input', updateSuggestions);
        
        // Hide suggestions when focus is lost (after a small delay)
        bookNameInput.addEventListener('blur', () => {
            setTimeout(() => {
                bookSuggestions.style.display = 'none';
            }, 200);
        });
        
        // Show suggestions again on focus (THIS IS THE KEY CHANGE)
        bookNameInput.addEventListener('focus', () => {
            // Call updateSuggestions to show the full list (as per the new logic)
            updateSuggestions();
        });
    }
  
  // Learning state
  let editIndex = null;
  let currentVerse = null;
  let userInput = '';
  let learningStage = 'basic'; // 'basic', 'intermediate', 'advanced'
  let learnFullText = '';
  let learnFullInitials = '';
  let reviewVerses = [];
  // Review-mode state: 'individual' | 'singleText' | null
  let reviewCollectionMode = null;
  // For single-text collection review we'll accumulate completed lines here
  let singleTextPrev = [];
  // index of current verse when iterating through reviewVerses in single-text mode
  let singleTextReviewIndex = 0;
  // count of verses successfully reviewed (accuracy > 90%) during current review session
  let reviewSuccessCount = 0;
  // Sound / buzzer state
  let audioCtx = null;
  let isMuted = true; // default: muted (no sound)
  let prevUserInputLength = 0;
  // Modal / completion state
  let pendingCompletion = { success: false, accuracy: 0 };
  // Track last displayed error so help text updates when a new error occurs
  let lastErrorIndex = null;
  let lastErrorChar = null;
  // Intermediate stage variant: 'odd' or 'even'. Controls which input-required chars are visible.
  let intermediateVariant = 'odd';

  // Spaced Repetition Algorithm
  // Card data structure: { interval, repetitions, dueDate }
  function spacedRepetitionBinary(card, success, currentDate) {
    if (!success) {
      // Failure: reset repetitions and interval
      card.repetitions = 0;
      card.interval = 1;
    } else {
      // Success: increment repetitions
      card.repetitions += 1;

      // Calculate base interval based on repetitions
      let baseInterval;
      if (card.repetitions === 1) {
        baseInterval = 1;  // after 1st success, review next day
      } else if (card.repetitions === 2) {
        baseInterval = 6;  // after 2nd success, lengthen interval more
      } else {
        // Subsequent successes multiply interval by a constant factor, e.g., 2
        baseInterval = Math.round(card.interval * 2);
      }

      // Apply early review penalty if reviewed before due date
      if (card.dueDate) {
        const dueDate = new Date(card.dueDate);
        const daysSinceDue = (currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceDue < 0) {
          // Early review: reduce interval advancement proportionally
          // Formula: actual interval = baseInterval * (days waited / expected interval)
          const previousInterval = card.interval || 1;
          const daysWaited = Math.max(0, previousInterval + daysSinceDue); // days since last review
          const earlyReviewFactor = Math.max(0.5, daysWaited / previousInterval); // minimum 50% credit
          card.interval = Math.round(baseInterval * earlyReviewFactor);
        } else {
          // On-time or overdue review: full interval advancement
          card.interval = baseInterval;
        }
      } else {
        // No previous due date: use full interval (first review after learning)
        card.interval = baseInterval;
      }
    }

    card.dueDate = new Date(currentDate.getTime() + card.interval * 24 * 60 * 60 * 1000);

    return card;
  }

  // Helper: floor-based days/hours until due so <24h shows hours
  function getDaysUntilDue(dueDate) {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const msPerHour = 1000 * 60 * 60;
    const msPerDay = msPerHour * 24;
    // Use Math.trunc to round towards zero (not down) so overdue by 3 hours shows as 0 days, not -1 days
    const days = Math.trunc(diffTime / msPerDay);
    const hours = Math.trunc(diffTime / msPerHour);
    return { days, hours, milliseconds: diffTime };
  }

  // Helper function to count due verses in a collection
  function countDueVerses(verseIds, verses) {
    const now = new Date();
    return verseIds.filter(vid => {
      const v = verses.find(x => x.id === vid);
      if (!v || !v.lastReviewed) return false;
      if (!v.dueDate) return true; // Consider verses without dueDate as due
      return new Date(v.dueDate) <= now;
    }).length;
  }

  // Function to update review button badge with due count
  function updateReviewBadge() {
    const verses = JSON.parse(localStorage.getItem('verses') || '[]');
    const learnedVerses = verses.filter(v => v && v.lastReviewed);
    const now = new Date();
    
    console.log('updateReviewBadge: Total verses:', verses.length, 'Learned:', learnedVerses.length);
    
    const dueCount = learnedVerses.filter(v => {
      if (!v.dueDate) {
        console.log('Verse without dueDate (counting as due):', v.bookName, v.chapterNumber + ':' + v.verseNumber);
        return true; // Consider verses without dueDate as due
      }
      const due = new Date(v.dueDate) <= now;
      if (due) {
        console.log('Due verse:', v.bookName, v.chapterNumber + ':' + v.verseNumber, 'Due:', v.dueDate);
      }
      return due;
    }).length;
    
    console.log('Total due count:', dueCount);
    
    const badge = document.getElementById('reviewBadge');
    const reviewBtn = document.getElementById('reviewBtn');
    
    console.log('Badge element:', badge, 'Review button:', reviewBtn);
    
    if (badge && reviewBtn) {
      if (dueCount > 0) {
        badge.textContent = dueCount;
        badge.style.display = 'inline-block';
        console.log('Badge updated with count:', dueCount);
      } else {
        badge.style.display = 'none';
        console.log('No due verses, badge hidden');
      }
    }
  }


  function loadVersesForEdit() {
    const verses = JSON.parse(localStorage.getItem('verses') || '[]');
    const sortedVerses = sortVersesByBibleOrder([...verses]);
    const listDiv = addVerseList; // id 'addVerseList'
    listDiv.innerHTML = '';

    sortedVerses.forEach((v, i) => {
      const verseItem = document.createElement('div');
      verseItem.className = 'verse-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'add-verse-checkbox';
      checkbox.dataset.verseId = v.id;

      const verseContent = document.createElement('div');
      verseContent.className = 'verse-content';

      const reference = document.createElement('div');
      reference.className = 'reference';
      reference.textContent = `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`;

      const text = document.createElement('div');
      text.className = 'text';
      text.textContent = v.verseText;

      // collection membership tags
      const cols = getCollections();
      const memberships = cols.filter(c => Array.isArray(c.verseIds) && c.verseIds.includes(v.id));
      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'collection-tags';
      memberships.forEach(mc => {
        const span = document.createElement('span');
        span.className = 'collection-tag';
        span.textContent = mc.title;
        tagsDiv.appendChild(span);
      });

      if (v.lastReviewed) {
        const lastReviewed = document.createElement('div');
        lastReviewed.className = 'last-reviewed';
        const days = Math.floor((new Date() - new Date(v.lastReviewed)) / (1000 * 60 * 60 * 24));
        lastReviewed.textContent = `${t('last_reviewed')}: ${days} ${t('days_ago')}`;
        verseContent.appendChild(lastReviewed);
      }

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'button-container';

      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️';
      editBtn.title = t('edit');
      editBtn.addEventListener('click', () => {
        const allVerses = JSON.parse(localStorage.getItem('verses') || '[]');
        editIndex = allVerses.findIndex(verse => verse.id === v.id);
        document.getElementById('verseText').value = v.verseText;
        document.getElementById('bookNameInput').value = v.bookName;
        document.getElementById('chapterNumber').value = v.chapterNumber;
        document.getElementById('verseNumber').value = v.verseNumber;
        document.getElementById('verseInitials').value = v.verseInitials;
        document.getElementById('bookInitials').value = v.bookInitials;
        document.getElementById('bibleVersion').value = v.bibleVersion || '';
        // If this verse belongs to a collection, pre-select that collection in the add panel select
        const cols = getCollections();
        let found = null;
        cols.forEach(c => { if (c.verseIds && c.verseIds.includes(v.id)) found = c.id; });
        try { if (addToCollectionSelect) addToCollectionSelect.value = found || ''; } catch (e) {}
        showPanel(addVersePanel);
        saveVerseBtn.textContent = t('update_verse');
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '❌';
      deleteBtn.title = t('delete');
      deleteBtn.addEventListener('click', () => {
        if (confirm(t('delete_confirmation'))) {
          const allVerses = JSON.parse(localStorage.getItem('verses') || '[]');
          const verseIndex = allVerses.findIndex(verse => verse.id === v.id);
          if (verseIndex !== -1) {
            allVerses.splice(verseIndex, 1);
            localStorage.setItem('verses', JSON.stringify(allVerses));
            loadVersesForEdit();
            updateReviewBadge();
          }
        }
      });

  verseContent.appendChild(reference);
  verseContent.appendChild(text);
  // append bible version (if any)
  if (v.bibleVersion) {
    const version = document.createElement('div');
    version.className = 'bible-version';
    version.textContent = v.bibleVersion;
    version.style.fontSize = '0.9em';
    version.style.color = '#888';
    version.style.fontStyle = 'italic';
    version.style.marginTop = '4px';
    verseContent.appendChild(version);
  }
  // append tags (if any)
  if (tagsDiv && tagsDiv.children.length > 0) verseContent.appendChild(tagsDiv);
      buttonContainer.appendChild(editBtn);
      buttonContainer.appendChild(deleteBtn);
      verseItem.appendChild(checkbox);
      verseItem.appendChild(verseContent);
      verseItem.appendChild(buttonContainer);
      listDiv.appendChild(verseItem);
    });

    // wire checkbox visibility for bulk actions
    const boxes = Array.from(document.querySelectorAll('.add-verse-checkbox'));
    boxes.forEach(b => b.addEventListener('change', () => {
      const any = Array.from(document.querySelectorAll('.add-verse-checkbox:checked')).length > 0;
      if (bulkActions) bulkActions.style.display = any ? 'block' : 'none';
    }));
  }

  function loadCollectionsForReview() {
    const collections = getCollections();
    const verses = JSON.parse(localStorage.getItem('verses') || '[]');
    
    if (!reviewCollectionsList) return;
    reviewCollectionsList.innerHTML = '';
    
    if (collections.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'verse-item';
      empty.textContent = t('no_collections');
      reviewCollectionsList.appendChild(empty);
      return;
    }
    
    collections.forEach(col => {
      const learnedVerses = (col.verseIds || []).map(id => verses.find(v => v.id === id)).filter(v => v && v.lastReviewed);
      
      const collectionItem = document.createElement('div');
      collectionItem.className = 'review-collection-item';
      
      const header = document.createElement('div');
      header.className = 'review-collection-header';
      
      const expandIcon = document.createElement('span');
      expandIcon.className = 'collection-expand-icon';
      expandIcon.textContent = '▶';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'collection-checkbox';
      checkbox.dataset.collectionId = col.id;
      
      const title = document.createElement('span');
      title.className = 'collection-title';
      
      // Calculate number of verses due for review
      const dueCount = countDueVerses(col.verseIds || [], verses);
      title.textContent = `${col.title} (${t('due_count').replace('{count}', dueCount)})`;
      
      const count = document.createElement('span');
      count.className = 'collection-verse-count';
      count.textContent = `(${t('learned_count').replace('{count}', learnedVerses.length)})`;
      
      header.appendChild(expandIcon);
      header.appendChild(checkbox);
      header.appendChild(title);
      header.appendChild(count);
      
      const versesList = document.createElement('div');
      versesList.className = 'collection-verses-list';
      
      learnedVerses.forEach(verse => {
        const verseItem = document.createElement('div');
        verseItem.className = 'collection-verse-item';
        
        const reference = document.createElement('div');
        reference.className = 'verse-ref';
        reference.textContent = `${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber}`;
        
        const lastReviewed = document.createElement('div');
        lastReviewed.className = 'last-reviewed';
        if (verse.lastReviewed) {
          const date = new Date(verse.lastReviewed);
          let reviewText = `${t('last_reviewed')}: ${date.toLocaleDateString()}`;
          
          // Add due date information
          const dueInfo = getDaysUntilDue(verse.dueDate);
          if (dueInfo !== null) {
            if (dueInfo.milliseconds < 0) {
              const overdueDays = Math.abs(dueInfo.days);
              if (overdueDays >= 1) {
                reviewText += ` <span class="overdue">(${t('days_overdue').replace('{count}', overdueDays)})</span>`;
              } else {
                // Less than 24 hours overdue - show as "Due today"
                reviewText += ` <span class="due-soon">(${t('due_today')})</span>`;
              }
            } else if (dueInfo.days === 0 && dueInfo.hours >= 1 && dueInfo.hours <= 23) {
              // Less than 24 hours: show hours
              if (dueInfo.hours === 1) {
                reviewText += ` <span class="due-soon">(${t('due_in_hour')})</span>`;
              } else {
                reviewText += ` <span class="due-soon">(${t('due_in_hours').replace('{count}', dueInfo.hours)})</span>`;
              }
            } else if (dueInfo.days === 0) {
              reviewText += ` <span class="due-soon">(${t('due_today')})</span>`;
            } else {
              reviewText += ` <span class="due-future">(${t('due_in_days').replace('{count}', dueInfo.days)})</span>`;
            }
          }
          lastReviewed.innerHTML = reviewText;
        } else {
          lastReviewed.textContent = t('not_reviewed_yet');
        }
        
        verseItem.appendChild(reference);
        verseItem.appendChild(lastReviewed);
        versesList.appendChild(verseItem);
      });
      
      // Toggle expand/collapse on header click (except checkbox)
      header.addEventListener('click', (e) => {
        if (e.target === checkbox) return;
        const isExpanded = versesList.classList.toggle('expanded');
        expandIcon.classList.toggle('expanded', isExpanded);
      });
      
      collectionItem.appendChild(header);
      collectionItem.appendChild(versesList);
      reviewCollectionsList.appendChild(collectionItem);
    });
  }

  function loadVersesForReview() {
    const verses = JSON.parse(localStorage.getItem('verses') || '[]');
    const reviewList = reviewVerseList; // id 'reviewVerseList'
    reviewList.innerHTML = '';

    // Only show verses that have been learned (i.e. have lastReviewed)
    let learned = verses.filter(v => v && v.lastReviewed);
    if (!learned || learned.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'verse-item';
      empty.textContent = t('no_learned_verses');
      reviewList.appendChild(empty);
      return;
    }

    // Sort by due date for display in the review list
    learned.sort((a, b) => {
      const now = new Date();
      const aDue = a.dueDate ? new Date(a.dueDate) : now;
      const bDue = b.dueDate ? new Date(b.dueDate) : now;
      
      // Both overdue or both not overdue - sort by due date
      if ((aDue <= now && bDue <= now) || (aDue > now && bDue > now)) {
        return aDue - bDue;
      }
      
      // One is overdue, one is not - overdue comes first
      return aDue <= now ? -1 : 1;
    });

    learned.forEach((verse) => {
      const verseItem = document.createElement('div');
      verseItem.className = 'verse-item';
      
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'verse-checkbox';
  checkbox.dataset.verse = JSON.stringify(verse);
      
      const content = document.createElement('div');
      content.className = 'verse-content';
      
      const reference = document.createElement('div');
      reference.className = 'reference';
      reference.textContent = `${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber}`;
      
      const lastReviewed = document.createElement('div');
      lastReviewed.className = 'last-reviewed';
      if (verse.lastReviewed) {
        const days = Math.floor((new Date() - new Date(verse.lastReviewed)) / (1000 * 60 * 60 * 24));
        let reviewText = `${t('last_reviewed')}: ${days} ${t('days_ago')}`;
        
        // Add due date information
        const dueInfo = getDaysUntilDue(verse.dueDate);
        if (dueInfo !== null) {
          if (dueInfo.milliseconds < 0) {
            const overdueDays = Math.abs(dueInfo.days);
            if (overdueDays >= 1) {
              reviewText += ` <span class="overdue">(${t('days_overdue').replace('{count}', overdueDays)})</span>`;
            } else {
              // Less than 24 hours overdue - show as "Due today"
              reviewText += ` <span class="due-soon">(${t('due_today')})</span>`;
            }
          } else if (dueInfo.days === 0 && dueInfo.hours >= 1 && dueInfo.hours <= 23) {
            // Less than 24 hours: show hours
            if (dueInfo.hours === 1) {
              reviewText += ` <span class="due-soon">(${t('due_in_hour')})</span>`;
            } else {
              reviewText += ` <span class="due-soon">(${t('due_in_hours').replace('{count}', dueInfo.hours)})</span>`;
            }
          } else if (dueInfo.days === 0) {
            reviewText += ` <span class="due-soon">(${t('due_today')})</span>`;
          } else {
            reviewText += ` <span class="due-future">(${t('due_in_days').replace('{count}', dueInfo.days)})</span>`;
          }
        }
        lastReviewed.innerHTML = reviewText;
      } else {
        lastReviewed.textContent = t('not_reviewed_yet');
      }
      
      content.appendChild(reference);
      content.appendChild(lastReviewed);
      verseItem.appendChild(checkbox);
      verseItem.appendChild(content);
      reviewList.appendChild(verseItem);
    });
  }

  // Collections storage helpers
  function getCollections() {
    return JSON.parse(localStorage.getItem('collections') || '[]');
  }

  function saveCollections(cols) {
    localStorage.setItem('collections', JSON.stringify(cols));
  }

  function renderCollectionsList() {
    const cols = getCollections();
    collectionsList.innerHTML = '';
    cols.forEach((c) => {
      const item = document.createElement('div');
      item.className = 'collection-item';
      const title = document.createElement('div');
      title.textContent = c.title;
      const actions = document.createElement('div');
      actions.className = 'actions';
      const viewBtn = document.createElement('button');
      viewBtn.textContent = t('view');
      viewBtn.addEventListener('click', () => viewCollection(c.id));
      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️';
      editBtn.title = t('rename');
      editBtn.addEventListener('click', () => {
        const newTitle = prompt(t('new_collection_title'), c.title);
        if (newTitle === null) return;
        const colsAll = getCollections();
        const out = colsAll.map(x => x.id === c.id ? Object.assign({}, x, { title: (newTitle || '').trim() }) : x);
        saveCollections(out);
        renderCollectionsList();
        populateCollectionSelector();
        loadCollectionsForReview();
      });
      const delBtn = document.createElement('button');
      delBtn.textContent = '❌';
      delBtn.title = t('delete');
      delBtn.addEventListener('click', () => {
        if (!confirm(t('delete_confirmation'))) return;
        const updated = cols.filter(x => x.id !== c.id);
        saveCollections(updated);
        renderCollectionsList();
        populateCollectionSelector();
        loadCollectionsForReview();
      });
      actions.appendChild(viewBtn);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      item.appendChild(title);
      item.appendChild(actions);
      collectionsList.appendChild(item);
    });
  }

  function populateCollectionSelector() {
    const cols = getCollections();
    // add-verse panel selector
    if (addToCollectionSelect) {
      addToCollectionSelect.innerHTML = '';
      const empty = document.createElement('option'); empty.value = ''; empty.textContent = t('none');
      addToCollectionSelect.appendChild(empty);
      cols.forEach(c => { const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.title; addToCollectionSelect.appendChild(opt); });
    }
    // bulk-add modal selector
    if (bulkAddCollectionSelect) {
      bulkAddCollectionSelect.innerHTML = '';
      const empty = document.createElement('option'); empty.value = ''; empty.textContent = t('choose_collection');
      bulkAddCollectionSelect.appendChild(empty);
      cols.forEach(c => { const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.title; bulkAddCollectionSelect.appendChild(opt); });
      const createOpt = document.createElement('option'); createOpt.value = 'create_new'; createOpt.textContent = t('create_collection');
      bulkAddCollectionSelect.appendChild(createOpt);
    }
  }

  function viewCollection(id) {
    const cols = getCollections();
    const col = cols.find(c => c.id === id);
    if (!col) return;
    collectionDetail.style.display = 'block';
    collectionDetailTitle.textContent = col.title;
    // populate addVerseToCollection select with all verses
    const verses = JSON.parse(localStorage.getItem('verses') || '[]');
    addVerseToCollection.innerHTML = '';
    verses.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`;
      addVerseToCollection.appendChild(opt);
    });
    // render verses in collection in order
    renderCollectionVerses(col);
  }

  function renderCollectionVerses(col) {
    collectionVerses.innerHTML = '';
    const verses = JSON.parse(localStorage.getItem('verses') || '[]');
    col.verseIds = col.verseIds || [];
    col.verseIds.forEach((vid, idx) => {
      const v = verses.find(x => x.id === vid);
      const item = document.createElement('div');
      item.className = 'collection-verses-item';
      const left = document.createElement('div');
      left.textContent = v ? `${v.bookName} ${v.chapterNumber}:${v.verseNumber}` : '(missing)';
      const controls = document.createElement('div');
      controls.className = 'collection-controls';
      const up = document.createElement('button'); up.textContent = '↑';
      const down = document.createElement('button'); down.textContent = '↓';
      const remove = document.createElement('button'); remove.textContent = '❌'; remove.title = t('remove');
      up.addEventListener('click', () => { if (idx>0) { [col.verseIds[idx-1], col.verseIds[idx]] = [col.verseIds[idx], col.verseIds[idx-1]]; saveAndRerender(col); } });
      down.addEventListener('click', () => { if (idx < col.verseIds.length-1) { [col.verseIds[idx+1], col.verseIds[idx]] = [col.verseIds[idx], col.verseIds[idx+1]]; saveAndRerender(col); } });
      remove.addEventListener('click', () => { col.verseIds.splice(idx,1); saveAndRerender(col); });
      controls.appendChild(up); controls.appendChild(down); controls.appendChild(remove);
      item.appendChild(left); item.appendChild(controls);
      collectionVerses.appendChild(item);
    });

    function saveAndRerender(updatedCol) {
      const cols = getCollections();
      const out = cols.map(c => c.id === updatedCol.id ? updatedCol : c);
      saveCollections(out);
      renderCollectionsList();
      populateCollectionSelector();
      loadCollectionsForReview();
      renderCollectionVerses(updatedCol);
    }
  }

  startReviewBtn.addEventListener('click', () => {
    const selectedVerses = Array.from(document.querySelectorAll('.verse-checkbox:checked'))
      .map(checkbox => JSON.parse(checkbox.dataset.verse));
    
    if (selectedVerses.length === 0) {
      alert(t('select_verse_to_review'));
      return;
    }

    // Sort selected verses by Biblical order
    const sortedSelectedVerses = sortVersesByBibleOrder(selectedVerses);

    // Start an individual-verse review session (selected verses behave like a playlist)
    reviewCollectionMode = 'individual';
    reviewVerses = sortedSelectedVerses;
    reviewSuccessCount = 0;

    // Populate the verseSelector with only the selected verses so the reference is visible and can fade
    if (verseSelector) {
      verseSelector.innerHTML = '';
      reviewVerses.forEach((v, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`;
        verseSelector.appendChild(opt);
      });
      try { 
        verseSelector.selectedIndex = 0; 
        verseSelector.style.display = 'block'; 
        verseSelector.style.opacity = '1';
        verseSelector.disabled = true; // Disable during review to prevent changing verses
      } catch (e) {}
    }

    // Hide the verse selector label during review
    const verseSelectorLabel = document.getElementById('verseSelectorLabel');
    if (verseSelectorLabel) verseSelectorLabel.style.display = 'none';

    currentVerse = reviewVerses[0];
    singleTextPrev = [];
    singleTextReviewIndex = 0;
    setLearningStage('advanced'); // Review always uses advanced mode
    showPanel(learnPanel);
    startLearnMode(currentVerse);
    // NEW: Hide the "Learn Mode" title and mode buttons
  if (reviewModeHiddenControls) reviewModeHiddenControls.style.display = 'none';
  });

  // --- INDEPENDENT SINGLE-TEXT REVIEW SYSTEM ---
  let singleTextSession = null;
  function startSingleTextReviewSession(verses) {
    // Record session start time
    singleTextSession = {
      verses: verses,
      startTime: new Date(),
      endTime: null,
      currentIndex: 0,
      reviewedIds: [],
      allSameBookChapter: verses.every(v => v.bookName === verses[0].bookName && v.chapterNumber === verses[0].chapterNumber),
      input: '',
      answerKeys: [],
      displayLines: [],
      helpText: '',
      displayLines: verses.map(v => ({
        refHtml: `${v.bookInitials}${String(v.chapterNumber)}:${String(v.verseNumber)}`,
        text: v.verseText,
        finalHtml: '', // ADD THIS NEW PROPERTY
    })),
    };
    // Build answer keys and display lines
    singleTextSession.answerKeys = verses.map(v => v.verseInitials);
    singleTextSession.displayLines = buildSingleTextDisplayLines(verses, singleTextSession.allSameBookChapter);
    singleTextSession.currentIndex = 0;
    singleTextSession.reviewedIds = [];
    singleTextSession.input = '';
    singleTextSession.helpText = '';
    showPanel(learnPanel);
    if (verseSelector) verseSelector.style.display = 'none';
    renderSingleTextReview();
    // NEW: Hide the "Learn Mode" title and mode buttons for single-text review
  if (reviewModeHiddenControls) reviewModeHiddenControls.style.display = 'none';
    learnInput.value = '';
    learnInput.disabled = false;
    learnInput.focus();
    learnInput.removeEventListener('input', singleTextInputHandler);
    learnInput.addEventListener('input', singleTextInputHandler);
  }

  function buildSingleTextDisplayLines(verses, allSameBookChapter) {
    // Returns array of {ref, refHtml, text, fullText}
    return verses.map((v, i) => {
      let ref = '';
      let refHtml = '';
      if (i === 0 || !allSameBookChapter) {
        ref = `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`;
        refHtml = `<span class='reference-inline'>${ref}</span>`;
      } else {
        ref = `${v.verseNumber}`;
        refHtml = `<span class='reference-inline'>${ref}</span>`;
      }
      return {
        ref,
        refHtml,
        text: v.verseText,
        fullText: `${ref} ${v.verseText}`
      };
    });
  }

  function renderSingleTextReview() {
    if (!singleTextSession) return;
    const idx = singleTextSession.currentIndex;
    const lines = singleTextSession.displayLines;
    let html = '';
    
    // Show completed lines
    for (let i = 0; i < idx; ++i) {
        const lineText = lines[i].finalHtml || lines[i].text; // USE finalHtml HERE
        html += `<div class='completed-verse'>${lines[i].refHtml} ${lineText}</div>`;
    }
    
    // Show current line with reference in white, verse text as input-required
    if (idx < lines.length) {
        html += `<div class='current-verse-chars'>${lines[idx].refHtml} <span id='singleTextInputDisplay'></span></div>`;
    }
    learnVerseDisplay.innerHTML = html;
    // Show help text (accuracy, etc)
    learnFeedback.textContent = singleTextSession.helpText;
}

function populateBookDatalist() {
    const bookNameDatalist = document.getElementById('bookNamesList');
    if (!bookNameDatalist) return;

    // Clear existing options
    bookNameDatalist.innerHTML = '';

    // Add all book names as options
    CHINESE_BIBLE_BOOKS.forEach(book => {
        const option = document.createElement('option');
        // For a datalist, setting the value is enough. The text will display as the suggestion.
        option.value = book;
        bookNameDatalist.appendChild(option);
    });
}

  function singleTextInputHandler(e) {
    if (!singleTextSession) return;
    const idx = singleTextSession.currentIndex;
    const key = singleTextSession.answerKeys[idx];
    const currentVerseData = singleTextSession.verses[idx];
    const currentVerseText = currentVerseData.verseText;
    
    let input = learnInput.value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    // --- 1. BUZZER LOGIC (No change needed here) ---
    const prevInput = singleTextSession.input || '';
    const prevLen = prevInput.length;
    singleTextSession.input = input;

    if (input.length > prevLen) {
      for (let j = prevLen; j < input.length; j++) {
        const expected = key[j] ? key[j].toLowerCase() : null;
        const typed = input[j];
        if (expected && typed !== expected) {
          if (typeof isMuted !== 'undefined' && typeof playBuzzer === 'function' && !isMuted) {
            playBuzzer();
          }
          break;
        }
      }
    }

    // --- 2. CHARACTER-BY-CHARACTER DISPLAY & TIMING LOGIC ---
    let displayHTML = '';
    let inputIndex = 0; // Tracks position in the 'key' (pinyin initials) string

    for (const char of currentVerseText) {
      const isHanChar = (/\p{Script=Han}/u).test(char); 
      let className = 'verse-character';
      
      if (isHanChar && inputIndex < key.length) {
        
        const expectedInitial = key[inputIndex];
        const typedInitial = input[inputIndex];
        
        if (inputIndex < input.length) {
          if (typedInitial && typedInitial === expectedInitial) {
            className += ' correct'; 
          } else {
            // FIX 1: Changed 'error' to 'incorrect' to match CSS.
            className += ' incorrect'; 
          }
        } else {
          className += ' hidden'; 
        }

        displayHTML += `<span class="${className}">${char}</span>`;
        inputIndex++; 
        
      } else {
        // Punctuation, whitespace, or characters that do not require input.
        
        // FIX 2: Punctuation is revealed only when the total input length
        // is greater than or equal to the total required initials *before* this character.
        // This ensures punctuation appears precisely when the last character before it is typed.
        if (inputIndex <= input.length) { 
            className += ' correct'; 
            displayHTML += `<span class="${className}">${char}</span>`;
        } else {
            // Not yet revealed.
            className += ' hidden'; 
            displayHTML += `<span class="${className}">${char}</span>`;
        }
      }
    }
    
    const inputDisplay = document.getElementById('singleTextInputDisplay');
    if (inputDisplay) inputDisplay.innerHTML = displayHTML;
    // --- NEW: Provide live help/error text during single-text review ---
    // Compute the most recent typing error (if any) and update help text
    try {
      if (singleTextSession) {
        let latestErrorIndex = -1;
        let latestErrorChar = '';
        for (let i = 0; i < input.length; i++) {
          const expected = key[i] ? key[i].toLowerCase() : '';
          const typed = input[i] ? input[i].toLowerCase() : '';
          if (typed !== expected) {
            latestErrorIndex = i;
            latestErrorChar = expected;
          }
        }

        if (latestErrorIndex === -1) {
          singleTextSession.helpText = '';
          if (learnFeedback) {
            learnFeedback.textContent = '';
            learnFeedback.className = '';
          }
        } else {
          // Map the input index back to the corresponding character in the verse text
          let charCount = 0;
          let errorCharacter = '?';
          for (const ch of currentVerseText) {
            if ((/\p{Script=Han}/u).test(ch) || /[0-9]/.test(ch)) {
              if (charCount === latestErrorIndex) {
                errorCharacter = ch;
                break;
              }
              charCount++;
            }
          }

          singleTextSession.helpText = t('incorrect_input')
            .replace('{char}', errorCharacter)
            .replace('{pos}', latestErrorIndex + 1)
            .replace('{expected}', latestErrorChar);
          if (learnFeedback) {
            learnFeedback.textContent = singleTextSession.helpText;
            learnFeedback.className = 'error';
          }
        }
      }
    } catch (e) { /* ignore errors updating live help text */ }
    // --- END CHARACTER-BY-CHARACTER DISPLAY & TIMING LOGIC ---

    // --- 3. SCORING AND COMPLETION LOGIC (Unchanged) ---
    if (input.length === key.length) {
      let correct = 0;
      for (let i = 0; i < key.length; ++i) {
        if (input[i] && input[i].toLowerCase() === key[i].toLowerCase()) correct++;
      }
      const accuracy = key.length > 0 ? (correct / key.length) * 100 : 0;
      singleTextSession.helpText = `${t('accuracy')}: ${accuracy.toFixed(1)}%`;
      renderSingleTextReview();

      // Color the accuracy help text: green for >=90%, red otherwise
      try {
        if (learnFeedback) {
          learnFeedback.className = accuracy >= 90 ? 'success' : 'error';
        }
      } catch (e) { /* ignore */ }
      // **NEW: Save the final colored HTML before advancing.**
        singleTextSession.displayLines[idx].finalHtml = displayHTML;

      // Update spaced repetition data regardless of success/failure
      const verses = JSON.parse(localStorage.getItem('verses') || '[]');
      const v = singleTextSession.verses[idx];
      const verseIndex = verses.findIndex(x => x.id === v.id);
      if (verseIndex !== -1) {
        const now = new Date();
        
        // Initialize or update spaced repetition data
        if (!verses[verseIndex].interval) verses[verseIndex].interval = 0;
        if (!verses[verseIndex].repetitions) verses[verseIndex].repetitions = 0;
        
        // Apply spaced repetition algorithm (success or failure)
        const success = accuracy >= 90;
        const card = {
          interval: verses[verseIndex].interval,
          repetitions: verses[verseIndex].repetitions,
          dueDate: verses[verseIndex].dueDate
        };
        const updatedCard = spacedRepetitionBinary(card, success, now);
        
        verses[verseIndex].interval = updatedCard.interval;
        verses[verseIndex].repetitions = updatedCard.repetitions;
        verses[verseIndex].dueDate = updatedCard.dueDate.toISOString();
        
        if (success) {
          verses[verseIndex].lastReviewed = now.toISOString();
          singleTextSession.reviewedIds.push(v.id);
        }
        
        localStorage.setItem('verses', JSON.stringify(verses));
      }
      
      learnInput.disabled = true;

      setTimeout(() => {
        singleTextSession.currentIndex++;
        singleTextSession.input = '';
        learnInput.value = '';
        
        if (singleTextSession.currentIndex < singleTextSession.verses.length) {
          renderSingleTextReview();
          learnInput.disabled = false;
          learnInput.focus();
        } else {
          singleTextSession.endTime = new Date();
          const reviewedCount = singleTextSession.reviewedIds.length;
          // **NEW: Final display update and persistent message**
            renderSingleTextReview(); // Re-render one last time
            learnInput.disabled = true; // Disable input since session is complete
            updateReviewBadge(); // Update badge after single-text review
            alert(t('congratulations_reviewed_count').replace('{count}', reviewedCount));
            learnInput.style.display = 'none';
        }
      }, 500);
    }

}
  // --- END INDEPENDENT SINGLE-TEXT REVIEW SYSTEM ---

  // Replace the reviewCollectionBtn click handler to use a modal for mode selection
  if (typeof reviewCollectionBtn !== 'undefined' && reviewCollectionBtn) {
    reviewCollectionBtn.addEventListener('click', function(e) {
      // Get selected collection from checkbox
      const selectedCheckbox = document.querySelector('.collection-checkbox:checked');
      if (!selectedCheckbox) {
        alert(t('select_collection_to_review'));
        return;
      }
      
      const cid = selectedCheckbox.dataset.collectionId;
      const cols = getCollections();
      const col = cols.find(c => c.id === cid);
      if (!col) return;
      const verses = JSON.parse(localStorage.getItem('verses') || '[]');
      const list = (col.verseIds || []).map(id => verses.find(v => v.id === id)).filter(Boolean).filter(v => v.lastReviewed);
      if (list.length === 0) {
        alert(t('no_learned_verses_collection'));
        return;
      }

      // Show the review mode selection modal
      const reviewModeModal = document.getElementById('reviewModeModal');
      if (reviewModeModal) {
        reviewModeModal.classList.add('open');
        reviewModeModal.setAttribute('aria-hidden', 'false');

        // Wire up modal buttons (one-time safe)
        const individuallyBtn = document.getElementById('reviewIndividuallyBtn');
        const singleTextBtn = document.getElementById('reviewSingleTextBtn');

        // Remove previous listeners to avoid duplicates
        individuallyBtn.onclick = null;
        singleTextBtn.onclick = null;

        individuallyBtn.onclick = function() {
          reviewModeModal.classList.remove('open');
          reviewModeModal.setAttribute('aria-hidden', 'true');
          // Sort collection verses by Biblical order
          const sortedList = sortVersesByBibleOrder(list);
          // Start individual-verse review session
          reviewCollectionMode = 'individual';
          reviewVerses = sortedList;
          reviewSuccessCount = 0;
          if (verseSelector) {
            verseSelector.innerHTML = '';
            reviewVerses.forEach((v, idx) => {
              const opt = document.createElement('option');
              opt.value = idx;
              opt.textContent = `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`;
              verseSelector.appendChild(opt);
            });
            try { 
              verseSelector.selectedIndex = 0; 
              verseSelector.style.display = 'block'; 
              verseSelector.style.opacity = '1';
              verseSelector.disabled = true; // Disable during review to prevent changing verses
            } catch (e) {}
          }
          // Hide the verse selector label during review
          const verseSelectorLabel = document.getElementById('verseSelectorLabel');
          if (verseSelectorLabel) verseSelectorLabel.style.display = 'none';
          
          currentVerse = reviewVerses[0];
          singleTextPrev = [];
          singleTextReviewIndex = 0;
          // Ensure advanced mode is set before showing panel and starting learn mode
          setLearningStage('advanced');
          showPanel(learnPanel);
          startLearnMode(currentVerse);
          if (reviewModeHiddenControls) reviewModeHiddenControls.style.display = 'none';
        };

        singleTextBtn.onclick = function() {
          reviewModeModal.classList.remove('open');
          reviewModeModal.setAttribute('aria-hidden', 'true');
          startSingleTextReviewSession(list);
        };
      }
    }, true);
  }

  function clearForm() {
    document.getElementById('verseText').value = '';
    document.getElementById('bookNameInput').value = '';
    document.getElementById('chapterNumber').value = '';
    document.getElementById('verseNumber').value = '';
    document.getElementById('verseInitials').value = '';
    document.getElementById('bookInitials').value = '';
    // Auto-populate Bible version with default value
    document.getElementById('bibleVersion').value = localStorage.getItem('defaultBibleVersion') || '';
    editIndex = null;
    saveVerseBtn.textContent = t('save_verse');
    saveStatus.textContent = '';
  }

  addVerseBtn.addEventListener('click', () => {
    showPanel(addVersePanel);
    clearForm();
    // Auto-populate Bible version with default value if it's empty
    const bibleVersionInput = document.getElementById('bibleVersion');
    if (bibleVersionInput && !bibleVersionInput.value) {
      bibleVersionInput.value = localStorage.getItem('defaultBibleVersion') || '';
    }
  });

  clearFormBtn.addEventListener('click', clearForm);

  saveVerseBtn.addEventListener('click', () => {
    const verseText = document.getElementById('verseText').value.trim();
    const bookName = document.getElementById('bookNameInput').value.trim();
    const chapterNumber = document.getElementById('chapterNumber').value.trim();
    const verseNumber = document.getElementById('verseNumber').value.trim();
    const verseInitials = document.getElementById('verseInitials').value.trim();
    const bookInitials = document.getElementById('bookInitials').value.trim();
    const bibleVersion = document.getElementById('bibleVersion').value.trim();

    if (!verseText || !bookName || !chapterNumber || !verseNumber || !verseInitials || !bookInitials) {
      saveStatus.textContent = t('fill_all_fields');
      saveStatus.style.color = 'red';
      return;
    }
    if (isNaN(chapterNumber) || isNaN(verseNumber)) {
      saveStatus.textContent = t('chapter_verse_numbers');
      saveStatus.style.color = 'red';
      return;
    }

    let verses = JSON.parse(localStorage.getItem('verses') || '[]');
    
    // Check if we're editing and if the verse has review data
    if (editIndex !== null && verses[editIndex]) {
      const existingVerse = verses[editIndex];
      const hasReviewData = existingVerse.lastReviewed || existingVerse.dueDate || existingVerse.interval || existingVerse.repetitions;
      
      if (hasReviewData) {
        // Show modal to ask user if they want to reset review data
        const resetModal = document.getElementById('resetReviewDataModal');
        const yesBtn = document.getElementById('resetReviewYesBtn');
        const noBtn = document.getElementById('resetReviewNoBtn');
        
        if (resetModal) {
          resetModal.setAttribute('aria-hidden', 'false');
          resetModal.classList.add('open');
          
          // Remove old event listeners
          const newYesBtn = yesBtn.cloneNode(true);
          const newNoBtn = noBtn.cloneNode(true);
          yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
          noBtn.parentNode.replaceChild(newNoBtn, noBtn);
          
          // Yes - reset review data
          newYesBtn.onclick = () => {
            resetModal.setAttribute('aria-hidden', 'true');
            resetModal.classList.remove('open');
            saveVerseWithReviewData(verseText, bookName, chapterNumber, verseNumber, verseInitials, bookInitials, bibleVersion, verses, true);
          };
          
          // No - preserve review data
          newNoBtn.onclick = () => {
            resetModal.setAttribute('aria-hidden', 'true');
            resetModal.classList.remove('open');
            saveVerseWithReviewData(verseText, bookName, chapterNumber, verseNumber, verseInitials, bookInitials, bibleVersion, verses, false);
          };
        }
        return; // Exit here, modal handlers will complete the save
      }
    }
    
    // No review data to worry about, proceed with normal save
    saveVerseWithReviewData(verseText, bookName, chapterNumber, verseNumber, verseInitials, bookInitials, bibleVersion, verses, true);
  });

  // Helper function to save verse with or without preserving review data
  function saveVerseWithReviewData(verseText, bookName, chapterNumber, verseNumber, verseInitials, bookInitials, bibleVersion, verses, resetReviewData) {
    const verseData = {
      verseText,
      bookName,
      chapterNumber,
      verseNumber,
      verseInitials,
      bookInitials,
      bibleVersion: bibleVersion || '',
      lastReviewed: null,
      id: Date.now().toString(),
    };
    
    if (editIndex !== null) {
      // preserve id if present
      verseData.id = verses[editIndex].id || verseData.id;
      
      // If NOT resetting review data, preserve the existing review fields
      if (!resetReviewData && verses[editIndex]) {
        if (verses[editIndex].lastReviewed) verseData.lastReviewed = verses[editIndex].lastReviewed;
        if (verses[editIndex].dueDate) verseData.dueDate = verses[editIndex].dueDate;
        if (verses[editIndex].interval) verseData.interval = verses[editIndex].interval;
        if (verses[editIndex].repetitions) verseData.repetitions = verses[editIndex].repetitions;
      }
      
      verses[editIndex] = verseData;
      editIndex = null;
      saveVerseBtn.textContent = t('save_verse');
      saveStatus.textContent = t('verse_updated');
    } else {
      verses.push(verseData);
      saveStatus.textContent = t('verse_saved');
    }
    saveStatus.style.color = '#2d72d9';
    localStorage.setItem('verses', JSON.stringify(verses));

    // If user selected a collection in the Add panel, add this verse to that collection
    try {
      const chosen = addToCollectionSelect ? addToCollectionSelect.value : '';
      if (chosen) {
        const cols = getCollections();
        const col = cols.find(c => c.id === chosen);
        if (col) {
          col.verseIds = col.verseIds || [];
          if (!col.verseIds.includes(verseData.id)) col.verseIds.push(verseData.id);
          saveCollections(cols);
          renderCollectionsList();
          populateCollectionSelector();
          loadCollectionsForReview();
        }
      }
    } catch (e) { /* ignore */ }

    loadVersesForEdit();
    // Clear the add/edit form automatically after saving
    clearForm();
    // refresh collections UI
    renderCollectionsList();
    // Update review badge
    updateReviewBadge();
  }

  function loadUnlearnedVerses() {
    const verses = JSON.parse(localStorage.getItem('verses') || '[]');
    const unlearned = verses.filter(v => !v.lastReviewed);

    if (unlearned.length === 0) {
      alert(t('no_verses_to_learn'));
      return false;
    }
    // Sort by Bible book order
    const sortedUnlearned = sortVersesByBibleOrder([...unlearned]);
    verseSelector.style.display = '';
    verseSelector.innerHTML = '';
    sortedUnlearned.forEach((v, i) => {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`;
      verseSelector.appendChild(option);
    });

    startLearnMode(sortedUnlearned[0]);
    return true;
  }

  // Populate the verse selector with unlearned verses but do NOT start learn mode.
  function populateUnlearnedSelector() {
    const verses = JSON.parse(localStorage.getItem('verses') || '[]');
    let list = verses.filter(v => !v.lastReviewed);
    // If no unlearned verses, fall back to all verses
    if (list.length === 0) list = verses;
    // Sort by Bible book order
    list = sortVersesByBibleOrder(list);

    verseSelector.innerHTML = '';
    list.forEach((v, i) => {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`;
      verseSelector.appendChild(option);
    });

    // Select top verse and ensure selector visible
    try { verseSelector.selectedIndex = 0; verseSelector.style.opacity = '1'; } catch (e) {}
    return list;
  }

  function getUnlearnedList() {
    const verses = JSON.parse(localStorage.getItem('verses') || '[]');
    let list = verses.filter(v => !v.lastReviewed);
    if (list.length === 0) list = verses;
    // Sort by Bible book order
    return sortVersesByBibleOrder(list);
  }

  function startLearnMode(verse) {
    
  // --- REVISED RESET LOGIC (Enforce Basic Mode, Clear State, and VISIBILITY) ---
    
    // 1. CRITICAL FIX: Reset the learning stage to 'basic' by calling the setter function
    // NOTE: Only reset to 'basic' when we are NOT starting from a review session.
    // For review flows (individual or single-text) the caller sets the desired stage
    // (usually 'advanced') before calling startLearnMode, so avoid overriding it here.
    if (!(reviewVerses && reviewVerses.length > 0) && reviewCollectionMode === null) {
      setLearningStage('basic');
    }
    
    // 2. Ensure the mode buttons/controls are VISIBLE (from previous successful fix)
    if (window.reviewModeHiddenControls) {
        window.reviewModeHiddenControls.style.display = ''; 
    }
    
    // 3. Clear user input and reset completion flag
    userInput = ''; 
    window.learnComplete = false;
    // Existing resets that are still necessary:
    currentVerse = verse;
    learnInput.value = ''; // Clear the input field element
    learnInput.style.display = ''; // Ensure input field is visible
    prevUserInputLength = 0;
    learnInput.disabled = false;
    learnFeedback.textContent = '';
    learnNextBtn.style.display = 'none';
    learnRetryBtn.style.display = 'none';

    // Combine verse text and reference
    learnFullText = `${verse.verseText}\n${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber}`;
    // Combine all expected inputs in sequence: verse initials + book initials + chapter digits + verse digits
    // NOTE: we deliberately omit the colon from the expected-input string so the user does NOT type it.
    learnFullInitials = `${verse.verseInitials}${verse.bookInitials}${String(verse.chapterNumber)}${String(verse.verseNumber)}`;

    // Build mappings between character positions in learnFullText and input indexes (for chinese chars and digits).
    // charToInputIndex[i] -> index in learnFullInitials that corresponds to learnFullText[i], or null for punctuation.
    const chars = [...learnFullText];
    const charToInputIndex = new Array(chars.length).fill(null);
    const inputIndexToCharIndex = [];
    let inputIdx = 0;
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (/[\u4e00-\u9fa5]/.test(ch) || /[0-9]/.test(ch)) {
        charToInputIndex[i] = inputIdx;
        inputIndexToCharIndex[inputIdx] = i;
        inputIdx++;
      } else {
        charToInputIndex[i] = null;
      }
    }
    // expose mappings for render and feedback functions
    window.charToInputIndex = charToInputIndex;
    window.inputIndexToCharIndex = inputIndexToCharIndex;

    // If we're reviewing a collection as individual verses, ensure the selector reflects the current verse
    try {
      if (reviewCollectionMode === 'individual' && reviewVerses && reviewVerses.length > 0 && verseSelector) {
        const idx = reviewVerses.findIndex(v => 
          v.bookName === currentVerse.bookName &&
          v.chapterNumber === currentVerse.chapterNumber &&
          v.verseNumber === currentVerse.verseNumber
        );
        if (idx !== -1) {
          verseSelector.selectedIndex = idx;
          verseSelector.style.display = 'block';
          verseSelector.style.opacity = '1';
        }
      }
    } catch (e) { /* ignore DOM errors */ }

    renderVerseDisplay();
    
    // Delay focus to ensure all state is cleared and display is rendered
    // This prevents keyboard from appearing and immediately dismissing on mobile
    setTimeout(() => {
      learnInput.focus();
    }, 100);
  }

  function renderVerseDisplay() {
    let displayHTML = '';
    const chars = [...learnFullText];
    const refIndex = learnFullText.indexOf('\n');

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      // In single-text collection review we render the reference inline separately
      // and should not duplicate the reference characters that appear after the newline
      if (reviewCollectionMode === 'singleText' && refIndex >= 0 && i >= refIndex) {
        // skip reference characters here (they are handled by the inline reference)
        continue;
      }
      const map = window.charToInputIndex && window.charToInputIndex[i] !== undefined ? window.charToInputIndex[i] : null;

      if (map !== null) {
        // Input-requiring character (Chinese or digit)
        const expected = learnFullInitials[map];
        let className = 'verse-character';

        // Determine visibility for intermediate variant or advanced hidden state.
        let hiddenByStage = false;
        if (learningStage === 'intermediate') {
          const isOdd = ((map + 1) % 2) === 1; // 1-based odd check
          const visibleByVariant = (intermediateVariant === 'odd') ? isOdd : !isOdd;
          if (!visibleByVariant) hiddenByStage = true;
        } else if (learningStage === 'advanced') {
          hiddenByStage = true;
        }

        // If hidden by stage, reveal only when the user has typed that input index; show correct/incorrect coloring.
        if (hiddenByStage) {
          if (userInput.length > map) {
            // user has typed this index — reveal with correct/incorrect styling
            className += userInput[map].toLowerCase() === expected.toLowerCase() ? ' correct' : ' incorrect';
            displayHTML += `<span class="${className}">${char}</span>`;
          } else {
            // keep hidden
            className += ' hidden';
            displayHTML += `<span class="${className}">${char}</span>`;
          }
          continue;
        }

        // Not hidden: if user has typed for this index, mark correct/incorrect normally
        if (userInput.length > map) {
          className += userInput[map].toLowerCase() === expected.toLowerCase() ? ' correct' : ' incorrect';
        }

        displayHTML += `<span class="${className}">${char}</span>`;
      } else { // Punctuation, whitespace, or characters that do not require input.
        // --- START NEW LOGIC FOR PUNCTUATION DISPLAY (Requests 1 & 2) ---

        // Request 2: Find the nearest input-required character map index.
        // This ensures groups of punctuation marks (e.g., ?!) are revealed together.
        let mapOfNearestPrevInput = null;
        for (let k = i - 1; k >= 0; k--) {
            const map = window.charToInputIndex ? window.charToInputIndex[k] : null;
            if (map !== null) {
                mapOfNearestPrevInput = map;
                break;
            }
        }
        let mapOfNearestNextInput = null;
        for (let k = i + 1; k < chars.length; k++) {
            const map = window.charToInputIndex ? window.charToInputIndex[k] : null;
            if (map !== null) {
                mapOfNearestNextInput = map;
                break;
            }
        }
        const prevMap = mapOfNearestPrevInput; // Use nearest map for logic
        const nextMap = mapOfNearestNextInput; // Use nearest map for basic mode adjacent check
        
        let shown = false;
        let className = 'verse-character punctuation';

        // Detect if this punctuation is an initial punctuation (no input-required chars to its left)
        let isInitialPunct = (prevMap === null); // Simplified check

        // Show all initial punctuation (if any)
        if (isInitialPunct) {
            shown = true;
        }

        // --- STAGE LOGIC (Modified Advanced Mode) ---
        if (learningStage === 'intermediate' && prevMap !== null) {
            // Intermediate: show if it's the right variant (odd/even)
            const isOdd = ((prevMap + 1) % 2) === 1;
            const visibleByVariant = (intermediateVariant === 'odd') ? isOdd : !isOdd;
            if (visibleByVariant) shown = true;
        } else if (learningStage === 'advanced') { 
            // Request 1: In advanced: show if previous input-required character has been typed (regardless of correctness)
            if (prevMap !== null && userInput.length > prevMap) {
                shown = true;
            }
            // If not shown in advanced mode, add hidden class
            if (!shown) className += ' hidden';
        } else { // In basic: show if any adjacent char input is entered
            [prevMap, nextMap].forEach(adj => { 
                if (adj !== null && adj !== undefined && userInput.length > adj) {
                    shown = true; 
                } 
            });
        }
        
        // --- COLOR LOGIC (Modified to fulfill Request 1) ---
        // Request 1: Punctuation is displayed as 'correct' (white) if it is shown
        // AND the nearest preceding input-required character has been typed, regardless of correctness.
        if (shown && prevMap !== null && userInput.length > prevMap) {
            className = 'verse-character correct';
        }
        
        displayHTML += `<span class="${className}">${char}</span>`;
      }
    }

    // If we're doing a single-text collection review, prepend previously completed lines
    // and show the current verse reference inline above the characters.
    if (reviewCollectionMode === 'singleText') {
      let prefixHTML = '';
      if (singleTextPrev && singleTextPrev.length > 0) {
        prefixHTML += singleTextPrev.map(line => `<div class="completed-verse">${line}</div>`).join('\n');
        prefixHTML += '<br/>';
      }
      // Show current reference in white (not part of what user needs to type)
      try {
        // Determine if we should show abbreviated reference
        let refDisplay = '';
        if (currentVerse) {
          const prevVerse = singleTextPrev.length > 0 ? reviewVerses[singleTextReviewIndex - 1] : null;
          if (prevVerse && 
              prevVerse.bookName === currentVerse.bookName && 
              prevVerse.chapterNumber === currentVerse.chapterNumber) {
            // Same book and chapter - show only verse number
            refDisplay = `${currentVerse.verseNumber} `;
          } else {
            // Different book/chapter - show full reference
            refDisplay = `${currentVerse.bookName} ${currentVerse.chapterNumber}:${currentVerse.verseNumber} `;
          }
        }
        // Always show reference in white (user doesn't need to type it)
        prefixHTML += `<div class="inline-reference" style="color: white;">${refDisplay}</div>`;
      } catch (e) { /* ignore */ }
      learnVerseDisplay.innerHTML = prefixHTML + `<div class="current-verse-chars">${displayHTML}</div>`;
    } else {
      learnVerseDisplay.innerHTML = displayHTML;
    }
  }

  learnInput.addEventListener('keydown', (event) => {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
    }
  });

  // Mute toggle button
  const muteToggle = document.getElementById('muteToggle');
  if (muteToggle) {
    // initialize label - use the span inside the button
    const muteSpan = muteToggle.querySelector('span');
    if (muteSpan) muteSpan.textContent = t('sound_off');
    muteToggle.setAttribute('aria-pressed', 'true');
    muteToggle.addEventListener('click', () => {
      isMuted = !isMuted;
      if (!audioCtx) {
        // lazy create AudioContext on first user gesture
        try {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
          audioCtx = null;
        }
      }
      const muteSpan = muteToggle.querySelector('span');
      if (!isMuted) {
        if (muteSpan) muteSpan.textContent = t('sound_on');
        muteToggle.querySelector('span').previousSibling.textContent = '🔊 ';
        muteToggle.setAttribute('aria-pressed', 'false');
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      } else {
        if (muteSpan) muteSpan.textContent = t('sound_off');
        muteToggle.querySelector('span').previousSibling.textContent = '🔇 ';
        muteToggle.setAttribute('aria-pressed', 'true');
      }
    });
  }

  // Play a short buzzer sound using Web Audio API
  function playBuzzer() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return; // audio not supported
      }
    }
    try {
      const now = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(280, now);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(now);
      o.stop(now + 0.15);
    } catch (e) {
      // ignore audio errors
    }
  }

  // Accuracy modal elements
  const accuracyModal = document.getElementById('accuracyModal');
  const modalMessage = document.getElementById('modalMessage');
  const modalAccuracy = document.getElementById('modalAccuracy');
  const modalRetryBtn = document.getElementById('modalRetryBtn');
  const modalNextBtn = document.getElementById('modalNextBtn');

  function showAccuracyModal(success, accuracy) {
    if (!accuracyModal) return;
    // set texts
    if (success) {
      // Choose message and button label. Prioritize review-mode decisions
      // so non-last review successes show "Next" and last-review shows a
      // congratulatory summary + "Finish".
      let isLast = false;
      if (reviewVerses && reviewVerses.length > 0) {
        const idx = reviewVerses.findIndex(v => 
          v.bookName === currentVerse.bookName && 
          v.chapterNumber === currentVerse.chapterNumber &&
          v.verseNumber === currentVerse.verseNumber
        );
        isLast = idx === (reviewVerses.length - 1);

        if (isLast) {
          const totalReviewed = (reviewSuccessCount || 0) + (success ? 1 : 0);
          modalMessage.textContent = `${t('congratulations_reviewed')} ${totalReviewed} ${t('verses')}`;
        } else {
          modalMessage.textContent = t('great_job_continue');
        }
      } else if (learningStage === 'intermediate') {
        modalMessage.textContent = t('great_job_intermediate');
      } else if (learningStage === 'advanced') {
        modalMessage.textContent = t('congratulations_mastered');
      } else {
        modalMessage.textContent = t('great_job_basic');
      }

      // Decide button label now (so it appears correctly when the modal opens)
      if (modalNextBtn) {
        if (reviewVerses && reviewVerses.length > 0) {
          modalNextBtn.textContent = isLast ? t('finish') : t('next');
        } else if (learningStage === 'advanced') {
          modalNextBtn.textContent = t('finish');
        } else {
          modalNextBtn.textContent = t('next');
        }
        modalNextBtn.style.display = 'inline-block';
      }

      // Hide retry on success only for review sessions. In learn mode
      // users should always have the option to retry even after success.
      if (modalRetryBtn) {
        if (reviewVerses && reviewVerses.length > 0) {
          modalRetryBtn.style.display = 'none';
        } else {
          modalRetryBtn.style.display = 'inline-block';
        }
      }
    } else {
      modalMessage.textContent = t('nice_try');
      modalNextBtn.style.display = 'none';
      if (modalRetryBtn) modalRetryBtn.style.display = 'inline-block';
    }
    modalAccuracy.textContent = `${t('accuracy')}: ${accuracy.toFixed(1)}%`;

    // show modal and prevent outside click close
    accuracyModal.classList.add('open');
    accuracyModal.removeAttribute('aria-hidden');
    
    // Set focus to the appropriate button AFTER showing modal
    setTimeout(() => {
      if (success && modalNextBtn) {
        modalNextBtn.focus();
      } else if (modalRetryBtn) {
        modalRetryBtn.focus();
      }
    }, 100);
    
    // ensure input is disabled until modal action
    learnInput.disabled = true;
  }

  function closeAccuracyModal() {
    if (!accuracyModal) return;
    accuracyModal.classList.remove('open');
    accuracyModal.setAttribute('aria-hidden', 'true');
  }

  // Wire modal buttons
  if (modalRetryBtn) {
    modalRetryBtn.addEventListener('click', () => {
      // Apply spaced repetition for failure before allowing retry
      if (!pendingCompletion.success && learningStage === 'advanced') {
        const verses = JSON.parse(localStorage.getItem('verses') || '[]');
        const verseIndex = verses.findIndex(v => 
          v.bookName === currentVerse.bookName && 
          v.chapterNumber === currentVerse.chapterNumber &&
          v.verseNumber === currentVerse.verseNumber
        );
        if (verseIndex !== -1) {
          const now = new Date();
          
          // Initialize or update spaced repetition data
          if (!verses[verseIndex].interval) verses[verseIndex].interval = 0;
          if (!verses[verseIndex].repetitions) verses[verseIndex].repetitions = 0;
          
          // Apply spaced repetition algorithm with failure
          const card = {
            interval: verses[verseIndex].interval,
            repetitions: verses[verseIndex].repetitions,
            dueDate: verses[verseIndex].dueDate
          };
          const updatedCard = spacedRepetitionBinary(card, false, now);
          
          verses[verseIndex].interval = updatedCard.interval;
          verses[verseIndex].repetitions = updatedCard.repetitions;
          verses[verseIndex].dueDate = updatedCard.dueDate.toISOString();
          
          localStorage.setItem('verses', JSON.stringify(verses));
        }
      }
      
      closeAccuracyModal();
      // reuse existing retry behavior
      learnRetryBtn.click();
    });
  }

  if (modalNextBtn) {
    modalNextBtn.addEventListener('click', () => {
      // Update lastReviewed if success in advanced mode
      if (pendingCompletion.success && learningStage === 'advanced') {
        const verses = JSON.parse(localStorage.getItem('verses') || '[]');
        const verseIndex = verses.findIndex(v => 
          v.bookName === currentVerse.bookName && 
          v.chapterNumber === currentVerse.chapterNumber &&
          v.verseNumber === currentVerse.verseNumber
        );
        if (verseIndex !== -1) {
          const now = new Date();
          verses[verseIndex].lastReviewed = now.toISOString();
          
          // Initialize or update spaced repetition data
          if (!verses[verseIndex].interval) verses[verseIndex].interval = 0;
          if (!verses[verseIndex].repetitions) verses[verseIndex].repetitions = 0;
          
          // Apply spaced repetition algorithm
          const card = {
            interval: verses[verseIndex].interval,
            repetitions: verses[verseIndex].repetitions,
            dueDate: verses[verseIndex].dueDate
          };
          const updatedCard = spacedRepetitionBinary(card, true, now);
          
          verses[verseIndex].interval = updatedCard.interval;
          verses[verseIndex].repetitions = updatedCard.repetitions;
          verses[verseIndex].dueDate = updatedCard.dueDate.toISOString();
          
          localStorage.setItem('verses', JSON.stringify(verses));
        }

        closeAccuracyModal();
        
        // Check if this is part of a review session
        if (reviewVerses && reviewVerses.length > 0) {
            // For individual-verse review flows (modal-driven), record this
            // successful review now so the modal summary reflects the total
            // number of successful verses including the current one.
            if (reviewCollectionMode !== 'singleText' && pendingCompletion.success) {
              reviewSuccessCount = (reviewSuccessCount || 0) + 1;
            }
          // Find current verse index in review list
          const currentIndex = reviewVerses.findIndex(v => 
            v.bookName === currentVerse.bookName && 
            v.chapterNumber === currentVerse.chapterNumber &&
            v.verseNumber === currentVerse.verseNumber
          );

          // If we're in single-text collection review, append the completed verse to the inline display
          if (reviewCollectionMode === 'singleText') {
            // Count successful reviews
            if (pendingCompletion.success) reviewSuccessCount = (reviewSuccessCount || 0) + 1;

            // Append the completed verse (full reference + text) to the accumulated display
            try {
              const fullRef = `${currentVerse.bookName} ${currentVerse.chapterNumber}:${currentVerse.verseNumber}`;
              singleTextPrev = singleTextPrev || [];
              singleTextPrev.push(`<span class="reference-inline">${fullRef}</span> ${currentVerse.verseText}`);
            } catch (e) { /* ignore */ }

            if (currentIndex < reviewVerses.length - 1) {
              // Move to next verse in the collection (keep selector hidden)
              const nextV = reviewVerses[currentIndex + 1];
              currentVerse = nextV;
              userInput = '';
              prevUserInputLength = 0;
              learnInput.value = '';
              learnFeedback.textContent = '';
              learnFeedback.className = '';
              // startLearnMode will render the accumulated prefix via renderVerseDisplay
              startLearnMode(currentVerse);
            } else {
              // Finished the collection review. Show summary with count of successful reviews
              const totalReviewed = reviewSuccessCount || 0;
              reviewVerses = [];
              currentVerse = null;
              showPanel(reviewPanel);
              loadVersesForReview(); // Refresh with updated lastReviewed times
              updateReviewBadge();
              if (verseSelector) verseSelector.style.display = 'block'; // restore selector
              alert(`${t('congratulations_reviewed')} ${totalReviewed} ${t('verses')}`);
            }
            return;
          }

          // Individual-verse review (default) — move to the next selected verse
          if (currentIndex < reviewVerses.length - 1) {
            // More verses to review - show next one
            currentVerse = reviewVerses[currentIndex + 1];
            userInput = '';
            prevUserInputLength = 0;
            learnInput.value = '';
            learnFeedback.textContent = '';
            learnFeedback.className = '';
            startLearnMode(currentVerse);
          } else {
            // Review session complete - return to review panel
            reviewVerses = [];
            currentVerse = null;
            showPanel(reviewPanel);
            loadVersesForReview(); // Refresh with updated lastReviewed times
            updateReviewBadge();
            if (verseSelector) {
              verseSelector.style.display = 'block'; // Show verse selector again
              verseSelector.disabled = false; // Re-enable selector when review is complete
            }
            // Show the verse selector label again
            const verseSelectorLabel = document.getElementById('verseSelectorLabel');
            if (verseSelectorLabel) verseSelectorLabel.style.display = '';
          }
          return;
        }

        // Not in review - reset to basic learning mode
        userInput = '';
        prevUserInputLength = 0;
        learnInput.value = '';
        learnFeedback.textContent = '';
        learnFeedback.className = '';
        const list = populateUnlearnedSelector();
        setLearningStage('basic');
        showPanel(learnPanel);
        if (verseSelector) verseSelector.style.display = 'block';
        if (list && list.length > 0) {
          currentVerse = list[0];
          startLearnMode(currentVerse);
        } else {
          try { if (verseSelector) verseSelector.focus(); } catch (e) {}
        }
        return;
      }

      // Default: proceed to next (reuse existing next behavior)
      closeAccuracyModal();
      learnNextBtn.click();
    });
  }

  learnInput.addEventListener('input', () => {
    // FIX: When in single-text collection review mode, bypass the general learn logic 
    // as the singleTextInputHandler manages the input for this mode.
    if (singleTextSession) {
        return;
    }

    const inputStr = learnInput.value.toLowerCase().replace(/[^a-z0-9]/g, '');
    const prevLen = prevUserInputLength;
    userInput = inputStr;
    // Play buzzer for any newly-typed incorrect characters when unmuted
    if (userInput.length > prevLen) {
      for (let j = prevLen; j < userInput.length; j++) {
        const expected = learnFullInitials[j] ? learnFullInitials[j].toLowerCase() : null;
        const typed = userInput[j];
        if (expected && typed !== expected) {
          if (!isMuted) playBuzzer();
          break; // play once per input event
        }
      }
    }

    prevUserInputLength = userInput.length;

    renderVerseDisplay();
    updateFeedback();
  });

  function updateFeedback() {
    let errorIndex = -1;
    let errorChar = '';
    let correctCount = 0;
    const totalInputsRequired = learnFullInitials.length;
    const chars = [...learnFullText];
    // Count correct inputs and find the most recent (latest) error index and mapping
    let mappedCharIndex = -1;
    let latestErrorIndex = -1;
    let latestErrorChar = '';
    for (let i = 0; i < userInput.length; i++) {
      const expected = learnFullInitials[i].toLowerCase();
      const typed = userInput[i].toLowerCase();
      const mapping = (window.inputIndexToCharIndex && window.inputIndexToCharIndex[i] !== undefined) ? window.inputIndexToCharIndex[i] : -1;
      if (typed === expected) {
        correctCount++;
      } else {
        // record as latest error (we overwrite so final value is the most recent error position)
        latestErrorIndex = i;
        latestErrorChar = expected;
        mappedCharIndex = mapping;
      }
    }

    // Update progress bar
    if (progressDisplay) {
      const progress = (correctCount / totalInputsRequired) * 100;
      progressDisplay.innerHTML = `<div class="bar" style="width: ${progress}%"></div>`;
    }

    // Fade out the verse selector text gradually to discourage cheating
    try {
      if (verseSelector) {
        const typedRatio = totalInputsRequired > 0 ? (userInput.length / totalInputsRequired) : 0;
        if (learningStage === 'intermediate' || learningStage === 'advanced') {
          // No fade below 25%, fully invisible at 50% or above
          let opacity = 1;
          if (typedRatio <= 0.25) opacity = 1;
          else if (typedRatio >= 0.5) opacity = 0;
          else {
            // linear from 1 -> 0 as typedRatio goes 0.25 -> 0.5
            opacity = 1 - (typedRatio - 0.25) / 0.25;
          }
          verseSelector.style.opacity = opacity.toString();
          // If we're in single-text collection review, also fade the inline reference the same way
          try {
            if (reviewCollectionMode === 'singleText') {
              const inlineRef = document.querySelector('.inline-reference');
              if (inlineRef) inlineRef.style.opacity = opacity.toString();
            }
          } catch (e) { /* ignore */ }
        } else {
          // ensure fully visible in basic mode
          verseSelector.style.opacity = '1';
        }
      }
    } catch (e) {
      // ignore DOM errors
    }

    // Show the most recent error (latestErrorIndex). Update help text when the latest error changes.
    if (latestErrorIndex === -1) {
      // no error currently — clear displayed help text and reset tracking so next error will show
      learnFeedback.textContent = '';
      learnFeedback.className = '';
      lastErrorIndex = null;
      lastErrorChar = null;
    } else {
      const errorCharacter = mappedCharIndex !== -1 ? chars[mappedCharIndex] : '?';
      if (lastErrorIndex !== latestErrorIndex || lastErrorChar !== latestErrorChar) {
        learnFeedback.textContent = t('incorrect_input')
          .replace('{char}', errorCharacter)
          .replace('{pos}', latestErrorIndex + 1)
          .replace('{expected}', latestErrorChar);
        learnFeedback.className = 'error';
        lastErrorIndex = latestErrorIndex;
        lastErrorChar = latestErrorChar;
      }
    }

    // Check if verse is complete
    if (userInput.length === totalInputsRequired) {
      // For single-text review mode we only calculate accuracy on the verse text (not reference)
      let verseOnlyAccuracy = 0;
      let totalAccuracy = 0;
      if (reviewCollectionMode === 'singleText') {
        const verseLength = learnFullText.indexOf('\n');
        if (verseLength >= 0) {
          let verseCorrect = 0;
          for (let i = 0; i < verseLength; i++) {
            const map = window.charToInputIndex && window.charToInputIndex[i];
            if (map !== null && map !== undefined) {
              if (userInput[map] && userInput[map].toLowerCase() === learnFullInitials[map].toLowerCase()) {
                verseCorrect++;
              }
            }
          }
          const verseInputs = verseLength;
          verseOnlyAccuracy = verseInputs > 0 ? (verseCorrect / verseInputs) * 100 : 0;
          totalAccuracy = verseOnlyAccuracy; // for single-text we care only about verse portion
        }
      } else {
        totalAccuracy = (correctCount / totalInputsRequired) * 100;
      }

      // Always show accuracy in feedback
      if (learnFeedback.textContent) {
        learnFeedback.textContent += `\n${t('accuracy')}: ${totalAccuracy.toFixed(1)}%`;
      } else {
        learnFeedback.textContent = `${t('accuracy')}: ${totalAccuracy.toFixed(1)}%`;
      }

      // Require 90% accuracy for all stages
      const requiredAccuracy = 90;
      const success = totalAccuracy >= requiredAccuracy;

      // Store pending completion
      pendingCompletion = { success, accuracy: totalAccuracy };

      // Color the accuracy help text: green for >=90%, red otherwise
      try {
        if (learnFeedback) {
          learnFeedback.className = success ? 'success' : 'error';
        }
      } catch (e) { /* ignore */ }

      if (reviewCollectionMode === 'singleText') {
        // For single-text review: update spaced repetition data regardless of success/failure
        const verses = JSON.parse(localStorage.getItem('verses') || '[]');
        const verseIndex = verses.findIndex(v => 
          v.bookName === currentVerse.bookName && 
          v.chapterNumber === currentVerse.chapterNumber &&
          v.verseNumber === currentVerse.verseNumber
        );
        if (verseIndex !== -1) {
          const now = new Date();
          
          // Initialize or update spaced repetition data
          if (!verses[verseIndex].interval) verses[verseIndex].interval = 0;
          if (!verses[verseIndex].repetitions) verses[verseIndex].repetitions = 0;
          
          // Apply spaced repetition algorithm (with success or failure)
          const card = {
            interval: verses[verseIndex].interval,
            repetitions: verses[verseIndex].repetitions,
            dueDate: verses[verseIndex].dueDate
          };
          const updatedCard = spacedRepetitionBinary(card, success, now);
          
          verses[verseIndex].interval = updatedCard.interval;
          verses[verseIndex].repetitions = updatedCard.repetitions;
          verses[verseIndex].dueDate = updatedCard.dueDate.toISOString();
          
          if (success) {
            verses[verseIndex].lastReviewed = now.toISOString();
            reviewSuccessCount++; // count successful reviews
          }
          
          localStorage.setItem('verses', JSON.stringify(verses));
        }

        // Find current verse index and prepare for next
        const currentIndex = reviewVerses.findIndex(v => 
          v.bookName === currentVerse.bookName && 
          v.chapterNumber === currentVerse.chapterNumber &&
          v.verseNumber === currentVerse.verseNumber
        );

        if (currentIndex < reviewVerses.length - 1) {
          // Append current verse text and move to next verse
          const fullRef = `${currentVerse.bookName} ${currentVerse.chapterNumber}:${currentVerse.verseNumber}`;
          singleTextPrev.push(`<span class="reference-inline">${fullRef}</span> ${currentVerse.verseText}`);
          singleTextReviewIndex = currentIndex + 1;
          currentVerse = reviewVerses[currentIndex + 1];
          userInput = '';
          prevUserInputLength = 0;
          learnInput.value = '';
          learnInput.disabled = false;
          startLearnMode(currentVerse);
        } else {
          // Collection review complete - show summary and return to review panel
          const totalReviewed = reviewSuccessCount;
          reviewVerses = [];
          currentVerse = null;
          showPanel(reviewPanel);
          loadVersesForReview(); // Refresh with updated lastReviewed times
          updateReviewBadge();
          if (verseSelector) {
            verseSelector.style.display = 'block';
            verseSelector.disabled = false; // Re-enable selector
          }
          // Show the verse selector label again
          const verseSelectorLabel = document.getElementById('verseSelectorLabel');
          if (verseSelectorLabel) verseSelectorLabel.style.display = '';
          alert(`${t('congratulations_reviewed')} ${totalReviewed} ${t('verses')}`);
        }
      } else {
        // For individual verse review: show modal with retry/next options
        showAccuracyModal(success, totalAccuracy);
        learnInput.disabled = true;
      }
    } else {
      learnRetryBtn.style.display = 'none';
      learnNextBtn.style.display = 'none';
    }
  }

  learnRetryBtn.addEventListener('click', () => {
    // Toggle intermediate variant between 'odd' and 'even' on retry so the user sees the opposite pattern
    if (learningStage === 'intermediate') {
      intermediateVariant = (intermediateVariant === 'odd') ? 'even' : 'odd';
    }
    // Reset input, coloring and help text
    userInput = '';
    learnInput.value = '';
    learnInput.disabled = false;
    lastErrorIndex = null;
    lastErrorChar = null;
    learnFeedback.textContent = '';
    learnFeedback.className = '';
    learnRetryBtn.style.display = 'none';
    learnNextBtn.style.display = 'none';
    renderVerseDisplay();
    learnInput.focus();
  });

  // Learning stage controls

  function setLearningStage(stage) {
    learningStage = stage;
    [basicMode, intermediateMode, advancedMode].forEach(btn => {
      btn.classList.remove('active');
    });
    
    switch (stage) {
      case 'basic':
        basicMode.classList.add('active');
        break;
      case 'intermediate':
        intermediateMode.classList.add('active');
        break;
      case 'advanced':
        advancedMode.classList.add('active');
        break;
    }

    if (currentVerse) {
      // Ensure verse selector is visible when changing stages (avoid lingering faded state)
      try { if (verseSelector) verseSelector.style.opacity = '1'; } catch (e) {}
      renderVerseDisplay();
    }
  }

  basicMode.addEventListener('click', () => setLearningStage('basic'));
  intermediateMode.addEventListener('click', () => setLearningStage('intermediate'));
  advancedMode.addEventListener('click', () => setLearningStage('advanced'));

  learnNextBtn.addEventListener('click', () => {
    let nextStage;
    switch (learningStage) {
      case 'basic':
        nextStage = 'intermediate';
        break;
      case 'intermediate':
        nextStage = 'advanced';
        break;
      default:
        // For advanced stage, move to next verse
        const verses = JSON.parse(localStorage.getItem('verses') || '[]');
        const unlearned = verses.filter(v => !v.lastReviewed);
        const currentIndex = unlearned.findIndex(v => 
          v.bookName === currentVerse.bookName && 
          v.chapterNumber === currentVerse.chapterNumber &&
          v.verseNumber === currentVerse.verseNumber
        );
        
        if (currentIndex < unlearned.length - 1) {
          currentVerse = unlearned[currentIndex + 1];
          nextStage = 'basic';
        } else {
          alert(t('completed_all_verses'));
          return;
        }
    }

    setLearningStage(nextStage);
    // Reset input, coloring and help text when advancing stage
    userInput = '';
    learnInput.value = '';
    learnInput.disabled = false;
    lastErrorIndex = null;
    lastErrorChar = null;
    learnFeedback.textContent = '';
    learnFeedback.className = '';
    learnNextBtn.style.display = 'none';
    renderVerseDisplay();
    learnInput.focus();
  });


verseSelector.addEventListener('change', () => {
    // Prevent verse changes during review mode
    if (reviewCollectionMode === 'individual' && reviewVerses && reviewVerses.length > 0) {
        // Reset to current verse index to prevent the selector from visually changing
        const currentIndex = reviewVerses.findIndex(v => 
          v.bookName === currentVerse.bookName && 
          v.chapterNumber === currentVerse.chapterNumber &&
          v.verseNumber === currentVerse.verseNumber
        );
        if (currentIndex !== -1) {
          verseSelector.selectedIndex = currentIndex;
        }
        return; // Exit early - don't allow verse changes during review
    }
    
    // Ensure the selected value is parsed as an integer index
    const selectedIdx = parseInt(verseSelector.value, 10);
    
    // Blur the selector to prevent keyboard issues on mobile
    verseSelector.blur();

    // Default behavior: the selector contains indices for the unlearned verses array.
    const verses = JSON.parse(localStorage.getItem('verses') || '[]');
    let unlearned = verses.filter(v => !v.lastReviewed);
    if (unlearned.length === 0) unlearned = verses;
    // Sort by Bible book order
    unlearned = sortVersesByBibleOrder(unlearned);
    
    // **CORRECTED FIX:** Use the index to select the verse from the filtered 'unlearned' array.
    // We ensure we don't go out of bounds.
    if (selectedIdx >= 0 && selectedIdx < unlearned.length) {
        window.currentVerse = unlearned[selectedIdx];
    } else {
        // Fallback or error handling if the index is invalid
        console.error("Verse index not found in unlearned list:", selectedIdx);
        // You might want to select the first verse as a fallback
        window.currentVerse = unlearned[0]; 
    }
    
    // Safety check before starting mode (though less likely to fail now)
    if (!window.currentVerse) {
        console.error("Failed to load verse after index lookup.");
        return; 
    }
    
    // Reset state
    learnInput.value = '';
    userInput = '';
    prevUserInputLength = 0;

    startLearnMode(window.currentVerse);
});

// Navigation Functions 
function hideAllPanels() { 
    // This list must include all panel variables defined at the top of window.onload
    const allPanels = [addVersePanel, learnPanel, reviewPanel, collectionsPanel, exportImportPanel, settingsPanel]; 
    allPanels.forEach(panel => {
        if (panel) panel.style.display = 'none';
    });
    // Don't auto-hide collection detail since it's shown/hidden by viewCollection() 
    if (collectionsPanel && collectionsPanel.style.display === 'none' && collectionDetail) { 
        collectionDetail.style.display = 'none';
    } 
}

function showPanel(panelToShow) {
  // NEW: Restore header and controls if we are going to learnPanel
  if (panelToShow === learnPanel) {
    if (reviewModeHiddenControls) reviewModeHiddenControls.style.display = 'block';
  }
    // CRITICAL FIX: Check if we are exiting the learn panel and if a single-text session is active.
    if (panelToShow !== learnPanel) {
        // We are navigating away from the 'Learn' panel.
        if (typeof singleTextSession !== 'undefined' && singleTextSession !== null) {
            // 1. Reset/Clear the session state
            singleTextSession = null;

            // 2. Reset the Learn Panel UI (as it was left in a "completed" state)
            if (learnInput) {
                learnInput.value = '';
                learnInput.disabled = false;
                learnInput.style.display = 'block'; // Restore visibility of the input field
            }
            if (learnFeedback) {
                learnFeedback.textContent = ''; // Clear the congratulatory message
            }
            if (verseSelector) {
                // Restore the verse selector, which is hidden during single-text review
                verseSelector.style.display = 'block';
            }
        }
    }

    hideAllPanels();
    if (panelToShow) panelToShow.style.display = 'block';
}

  // Navigation Event Listeners
  addVerseBtn.addEventListener('click', () => {
    showPanel(addVersePanel);
    loadVersesForEdit();
    populateCollectionSelector();
  });

  // Initialize review badge on page load
  updateReviewBadge();

  learnBtn.addEventListener('click', () => {
    // Hide all panels, then show the learnPanel
    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    learnPanel.style.display = 'block';

    // --- REVISED RESET LOGIC (Full Refresh) ---
    // 1. Reset ALL review state variables to ensure default mode is active
    window.reviewVerses = [];
    window.reviewCollectionMode = null;
    singleTextSession = null;  // Clear single-text review session
    singleTextPrev = [];
    singleTextReviewIndex = 0;
    reviewSuccessCount = 0;
    
    // 2. CRITICAL FIX: Ensure the mode buttons/controls are VISIBLE
    // The empty string resets the style to the element's default (e.g., 'block' or 'flex').
    if (window.reviewModeHiddenControls) {
        window.reviewModeHiddenControls.style.display = ''; 
    }
    
    // 3. Reset the Learn Panel UI elements
    if (learnInput) {
        learnInput.value = '';
        learnInput.disabled = false;
        learnInput.style.display = 'block';
    }
    if (learnFeedback) {
        learnFeedback.textContent = '';
        learnFeedback.className = '';
    }
    if (verseSelector) {
      verseSelector.style.display = 'block';
      verseSelector.style.opacity = '1';
      verseSelector.disabled = false; // Ensure selector is enabled in learn mode
    }
    // Ensure verse selector label is visible in learn mode
    const verseSelectorLabel = document.getElementById('verseSelectorLabel');
    if (verseSelectorLabel) verseSelectorLabel.style.display = '';    // 4. Load the default set of unlearned verses and start basic mode
    loadUnlearnedVerses(); 
    
    // 5. CRITICAL FIX: Ensure the learning mode is set to 'basic' 
    // This overrides any mode set by loadUnlearnedVerses/startLearnMode if needed.
    setLearningStage('basic');
  });

  reviewBtn.addEventListener('click', () => {
    showPanel(reviewPanel);
    loadVersesForReview();
    loadCollectionsForReview();
    updateReviewBadge();
  });

  exportBtn.addEventListener('click', () => {
    showPanel(exportImportPanel);
    // Populate export collections tree with available collections
    try {
      if (exportCollectionsList) {
        exportCollectionsList.innerHTML = '';
        const cols = getCollections();
        const allVerses = JSON.parse(localStorage.getItem('verses') || '[]');
        
        // Add each collection as a checkbox
        cols.forEach(c => {
          const item = document.createElement('div');
          item.className = 'tree-item';
          const label = document.createElement('label');
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.className = 'export-collection-checkbox';
          checkbox.dataset.collectionId = c.id;
          checkbox.checked = true;
          label.appendChild(checkbox);
          label.appendChild(document.createTextNode(` ${c.title} (${(c.verseIds || []).length} verses)`));
          item.appendChild(label);
          exportCollectionsList.appendChild(item);
        });
        
        // Add "Not in a collection" option
        const collectedIds = new Set();
        cols.forEach(c => (c.verseIds || []).forEach(id => collectedIds.add(id)));
        const uncollectedCount = allVerses.filter(v => !collectedIds.has(v.id)).length;
        
        const uncollectedItem = document.createElement('div');
        uncollectedItem.className = 'tree-item';
        const uncollectedLabel = document.createElement('label');
        const uncollectedCheckbox = document.createElement('input');
        uncollectedCheckbox.type = 'checkbox';
        uncollectedCheckbox.className = 'export-collection-checkbox';
        uncollectedCheckbox.dataset.collectionId = '__uncollected__';
        uncollectedCheckbox.checked = true;
        uncollectedLabel.appendChild(uncollectedCheckbox);
        uncollectedLabel.appendChild(document.createTextNode(` ${t('not_in_collection')} (${uncollectedCount} ${t('verses')})`));
        uncollectedItem.appendChild(uncollectedLabel);
        exportCollectionsList.appendChild(uncollectedItem);
        
        // Wire master checkbox
        if (exportAllVerses) {
          exportAllVerses.checked = true;
          exportAllVerses.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.export-collection-checkbox');
            checkboxes.forEach(cb => cb.checked = this.checked);
          });
        }
        
        // Wire child checkboxes to update master if needed
        const childCheckboxes = document.querySelectorAll('.export-collection-checkbox');
        childCheckboxes.forEach(cb => {
          cb.addEventListener('change', () => {
            if (exportAllVerses) {
              const allChecked = Array.from(childCheckboxes).every(c => c.checked);
              exportAllVerses.checked = allChecked;
            }
          });
        });
      }
    } catch(e) { /* ignore */ }
  });

  // Export/Import Functions
  downloadBtn.addEventListener('click', () => {
    const allVerses = JSON.parse(localStorage.getItem('verses') || '[]');
    const cols = getCollections();

    // Determine selected collection IDs from checkboxes
    const selectedCheckboxes = Array.from(document.querySelectorAll('.export-collection-checkbox:checked') || []);
    const selectedColIds = selectedCheckboxes.map(cb => cb.dataset.collectionId).filter(Boolean);
    const includeUncollected = selectedColIds.includes('__uncollected__');
    const actualColIds = selectedColIds.filter(id => id !== '__uncollected__');

    // Build verse set based on selections
    let versesToExport;
    if (selectedCheckboxes.length === 0) {
      // Nothing selected - export nothing (or could default to all)
      versesToExport = [];
    } else {
      const verseIdSet = new Set();
      
      // Add verses from selected collections
      if (actualColIds.length > 0) {
        cols.filter(c => actualColIds.includes(c.id)).forEach(c => {
          (c.verseIds || []).forEach(id => verseIdSet.add(id));
        });
      }
      
      // Add uncollected verses if checked
      if (includeUncollected) {
        const collectedIds = new Set();
        cols.forEach(c => (c.verseIds || []).forEach(id => collectedIds.add(id)));
        allVerses.filter(v => !collectedIds.has(v.id)).forEach(v => verseIdSet.add(v.id));
      }
      
      versesToExport = allVerses.filter(v => verseIdSet.has(v.id));
    }

    // Optionally strip review fields
    const includeReview = exportIncludeReview ? !!exportIncludeReview.checked : true;
    const cleaned = versesToExport.map(v => {
      const o = { ...v };
      if (!includeReview) {
        delete o.lastReviewed;
        delete o.interval;
        delete o.repetitions;
        delete o.dueDate;
      }
      return o;
    });
    // Optionally include collection data (titles and verse order as refs)
    const includeCollections = exportIncludeCollections ? !!exportIncludeCollections.checked : false;
    let payload = cleaned;
    if (includeCollections) {
      // Determine which collections to include: only selected actual collections (not uncollected)
      let includeCols;
      if (actualColIds.length === 0) includeCols = cols;
      else includeCols = cols.filter(c => actualColIds.includes(c.id));

      const idToVerse = new Map(allVerses.map(v => [v.id, v]));
      const collectionsExport = includeCols.map(c => {
        const verseRefs = (c.verseIds || [])
          .map(id => idToVerse.get(id))
          .filter(Boolean)
          .map(v => ({ bookName: v.bookName, chapterNumber: v.chapterNumber, verseNumber: v.verseNumber }));
        return { title: c.title, verseRefs };
      });
      payload = {
        type: 'cbm-export',
        version: 2,
        generatedAt: new Date().toISOString(),
        verses: cleaned,
        collections: collectionsExport
      };
    }

    const dataStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bible-verses.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Update file name display when file is selected
  importFile.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      importFileName.textContent = e.target.files[0].name;
    } else {
      importFileName.textContent = t('no_file_selected');
    }
  });

  importDataBtn.addEventListener('click', () => {
    const file = importFile.files[0];
    if (!file) {
      alert(t('select_file_to_import'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const importedVerses = Array.isArray(parsed) ? parsed : (parsed.verses || []);
        const importedCollections = Array.isArray(parsed) ? [] : (parsed.collections || []);
        const currentVerses = JSON.parse(localStorage.getItem('verses') || '[]');
        const shouldImportReview = importIncludeReview ? !!importIncludeReview.checked : true;
        
        // Merge verses, avoiding duplicates
        const mergedVerses = [...currentVerses];
        importedVerses.forEach(importedVerse => {
          const iv = { ...importedVerse };
          if (!shouldImportReview) {
            delete iv.lastReviewed;
            delete iv.interval;
            delete iv.repetitions;
            delete iv.dueDate;
          }
          
          // Find if this verse already exists
          const existingVerseIndex = currentVerses.findIndex(v => 
            v.bookName === importedVerse.bookName &&
            v.chapterNumber === importedVerse.chapterNumber &&
            v.verseNumber === importedVerse.verseNumber
          );
          
          if (existingVerseIndex !== -1) {
            // Verse exists - check which has more recent review data
            const existingVerse = currentVerses[existingVerseIndex];
            const existingReviewDate = existingVerse.lastReviewed ? new Date(existingVerse.lastReviewed) : null;
            const importedReviewDate = iv.lastReviewed ? new Date(iv.lastReviewed) : null;
            
            // Replace with imported verse if it has more recent review data
            if (importedReviewDate && (!existingReviewDate || importedReviewDate > existingReviewDate)) {
              mergedVerses[existingVerseIndex] = iv;
            }
            // Otherwise keep existing verse (already in mergedVerses)
          } else {
            // New verse - add it
            mergedVerses.push(iv);
          }
        });

        // Save verses first so collection mapping can find ids
        localStorage.setItem('verses', JSON.stringify(mergedVerses));

        // Optionally import collection data by title and verse refs
        const shouldImportCollections = importIncludeCollections ? !!importIncludeCollections.checked : true;
        if (shouldImportCollections && importedCollections && importedCollections.length > 0) {
          const cols = getCollections();
          // Build lookup from verse ref -> id
          const allNow = JSON.parse(localStorage.getItem('verses') || '[]');
          function findIdByRef(ref) {
            const v = allNow.find(x => x.bookName === ref.bookName && String(x.chapterNumber) === String(ref.chapterNumber) && String(x.verseNumber) === String(ref.verseNumber));
            return v ? v.id : null;
          }

          importedCollections.forEach(ic => {
            const ids = (ic.verseRefs || []).map(findIdByRef).filter(Boolean);
            if (ids.length === 0) return; // nothing resolvable
            // find existing by title
            const existing = cols.find(c => c.title === ic.title);
            if (!existing) {
              cols.push({ id: Date.now().toString() + Math.random().toString(36).slice(2,8), title: ic.title, verseIds: ids });
            } else {
              // Merge while preserving imported order at front and keeping unique ids
              const set = new Set();
              const merged = [];
              ids.forEach(id => { if (!set.has(id)) { set.add(id); merged.push(id); } });
              (existing.verseIds || []).forEach(id => { if (!set.has(id)) { set.add(id); merged.push(id); } });
              existing.verseIds = merged;
            }
          });
          saveCollections(cols);
        }

        alert(t('import_successful'));
        loadVersesForEdit();
        updateReviewBadge();
      } catch (error) {
        alert(t('error_importing') + ': ' + error.message);
      }
    };
    reader.readAsText(file);
  });

  // Collections event wiring
  if (collectionsBtn) {
    collectionsBtn.addEventListener('click', () => {
      showPanel(collectionsPanel);
      renderCollectionsList();
      populateCollectionSelector();
      collectionDetail.style.display = 'none';
    });
  }

  if (createCollectionBtn) {
    createCollectionBtn.addEventListener('click', () => {
      const title = (newCollectionTitle.value || '').trim();
      if (!title) { alert(t('enter_title')); return; }
      const cols = getCollections();
      cols.push({ id: Date.now().toString(), title, verseIds: [] });
      saveCollections(cols);
      newCollectionTitle.value = '';
      renderCollectionsList();
      populateCollectionSelector();
      loadCollectionsForReview();
    });
  }

  if (addToCollectionBtn) {
    addToCollectionBtn.addEventListener('click', () => {
      const title = collectionDetailTitle.textContent;
      const cols = getCollections();
      const col = cols.find(c => c.title === title);
      if (!col) { alert(t('select_collection_msg')); return; }
      const vid = addVerseToCollection.value;
      if (!vid) return;
      col.verseIds = col.verseIds || [];
      if (!col.verseIds.includes(vid)) col.verseIds.push(vid);
      saveCollections(cols);
      renderCollectionsList();
      populateCollectionSelector();
      loadCollectionsForReview();
      renderCollectionVerses(col);
    });
  }

  // (reviewCollectionBtn is handled earlier using the modal-based selector)

  // Bulk actions (Add selected / Delete selected) from the Add Verse panel
  if (bulkDeleteBtn) {
    bulkDeleteBtn.addEventListener('click', () => {
      const checked = Array.from(document.querySelectorAll('.add-verse-checkbox:checked'));
      if (checked.length === 0) { alert(t('select_at_least_one')); return; }
      if (!confirm(t('delete_count_confirmation').replace('{count}', checked.length))) return;
      const ids = checked.map(cb => cb.dataset.verseId);
      let verses = JSON.parse(localStorage.getItem('verses') || '[]');
      verses = verses.filter(v => !ids.includes(v.id));
      localStorage.setItem('verses', JSON.stringify(verses));
      loadVersesForEdit();
      updateReviewBadge();
      renderCollectionsList();
      populateCollectionSelector();
      if (bulkActions) bulkActions.style.display = 'none';
    });
  }

  if (bulkAddToCollectionBtn) {
    bulkAddToCollectionBtn.addEventListener('click', () => {
      // open modal and populate collections
      populateCollectionSelector();
      if (bulkAddModal) bulkAddModal.style.display = 'block';
      if (bulkAddModal) bulkAddModal.setAttribute('aria-hidden', 'false');
    });
  }

  if (bulkAddCollectionSelect) {
    bulkAddCollectionSelect.addEventListener('change', () => {
      if (!bulkCreateNew) return;
      if (bulkAddCollectionSelect.value === 'create_new') bulkCreateNew.style.display = 'block';
      else bulkCreateNew.style.display = 'none';
    });
  }

  if (bulkAddCancelBtn) {
    bulkAddCancelBtn.addEventListener('click', () => {
      if (bulkAddModal) { bulkAddModal.style.display = 'none'; bulkAddModal.setAttribute('aria-hidden', 'true'); }
      if (bulkNewCollectionName) bulkNewCollectionName.value = '';
    });
  }

  if (bulkAddConfirmBtn) {
    bulkAddConfirmBtn.addEventListener('click', () => {
      const checked = Array.from(document.querySelectorAll('.add-verse-checkbox:checked'));
      if (checked.length === 0) { alert(t('select_at_least_one')); return; }
      let chosen = bulkAddCollectionSelect ? bulkAddCollectionSelect.value : '';
      let cols = getCollections();
      if (!chosen) { alert(t('select_or_create_collection')); return; }
      if (chosen === 'create_new') {
        const name = (bulkNewCollectionName && bulkNewCollectionName.value || '').trim();
        if (!name) { alert(t('enter_collection_name')); return; }
        const newCol = { id: Date.now().toString(), title: name, verseIds: [] };
        cols.push(newCol);
        chosen = newCol.id;
      }
      const col = cols.find(c => c.id === chosen);
      if (!col) { alert(t('collection_not_found')); return; }
      col.verseIds = col.verseIds || [];
      const verses = JSON.parse(localStorage.getItem('verses') || '[]');
      checked.forEach(cb => {
        const vid = cb.dataset.verseId;
        if (!col.verseIds.includes(vid)) col.verseIds.push(vid);
      });
      saveCollections(cols);
      renderCollectionsList();
      populateCollectionSelector();
      loadCollectionsForReview();
      if (bulkAddModal) { bulkAddModal.style.display = 'none'; bulkAddModal.setAttribute('aria-hidden', 'true'); }
      if (bulkNewCollectionName) bulkNewCollectionName.value = '';
      if (bulkActions) bulkActions.style.display = 'none';
      loadVersesForEdit();
      alert(t('verses_added_to_collection'));
    });
  }

  // Setup input scroll behavior for mobile keyboards
  // Track scroll position to prevent iOS aggressive centering
  let savedScrollY = 0;
  
  window.addEventListener('scroll', () => {
    savedScrollY = window.scrollY;
  });
  
  function setupInputScrollBehavior() {
    const inputs = document.querySelectorAll('#addVersePanel input, #addVersePanel textarea');
    
    inputs.forEach(input => {
      input.addEventListener('focus', (e) => {
        // Prevent iOS default centering by maintaining current scroll position
        const targetScrollY = savedScrollY;
        
        // Small delay to override iOS behavior
        setTimeout(() => {
          window.scrollTo(0, targetScrollY);
        }, 0);
        
        // Additional check after keyboard animation
        setTimeout(() => {
          const element = e.target;
          const rect = element.getBoundingClientRect();
          
          // Only scroll if the input is not visible above keyboard
          // Assume keyboard takes up bottom ~40% of viewport
          const keyboardTop = window.innerHeight * 0.6;
          
          if (rect.bottom > keyboardTop) {
            // Scroll just enough to show the input above keyboard with padding
            const overflow = rect.bottom - keyboardTop + 20;
            window.scrollTo(0, window.scrollY + overflow);
          } else if (rect.top < 0) {
            // If input is above viewport, scroll it into view at top
            window.scrollTo(0, window.scrollY + rect.top - 20);
          }
        }, 300);
      });
    });
  }

  setupInputScrollBehavior();

  // Check if first time user and show settings (must be at end after all initialization)
  function checkFirstTimeUser() {
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    
    if (!hasVisitedBefore) {
      // First time user - show settings panel
      showPanel(settingsPanel);
      
      // Mark that user has visited
      localStorage.setItem('hasVisitedBefore', 'true');
    }
  }
  
  checkFirstTimeUser();

  // (initialization at top of file already performed)
};