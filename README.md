# ZH Bible Verse Memorizer PWA (Version 0.8)

A Progressive Web App for memorizing Chinese Bible verses with spaced repetition. This App is inspired by the Bible Memory App (https://biblememory.com/). I would recommend that app if you are memorizing Bible verses in English.

## 🚀 Features

- ✅ **Offline Support**: Works completely offline once installed
- 📱 **Mobile-First Design**: Optimized for iOS and Android devices
- 💻 **Desktop Support**: Also works on Mac and PC
- 📦 **Installable**: Can be installed as a standalone app
- 🔄 **Spaced Repetition**: Smart learning algorithm to optimize memory retention
- 🌐 **Multi-language**: English, Simplified Chinese, Traditional Chinese
- 🎨 **Theme Support**: Light, Dark, and System themes

## 📲 Installation Instructions

### iOS (iPhone/iPad)

1. Open Safari browser and navigate to the app URL
2. Tap the **Share** button (square with arrow pointing up)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"** in the top right corner
5. The app icon will appear on your home screen
6. Tap the icon to launch the app in standalone mode

### Android

1. Open Chrome browser and navigate to the app URL
2. Tap the **three dots menu** (⋮) in the top right
3. Tap **"Add to Home screen"** or **"Install app"**
4. Tap **"Add"** or **"Install"**
5. The app icon will appear on your home screen
6. Tap the icon to launch the app

### Windows/Mac Desktop

#### Chrome, Edge, or Brave:
1. Navigate to the app URL
2. Click the **install icon** (⊕) in the address bar, or
3. Click the **three dots menu** (⋮) → **"Install [App Name]"**
4. The app will open in its own window

#### Safari (Mac):
1. Open Safari and navigate to the app URL
2. Go to **File** → **"Add to Dock"**
3. The app will be added to your Dock

## 🎯 How to Use

### First Time Setup
- **Automatic Settings**: On first launch, the app automatically opens the Settings screen
- **Language Detection**: Language preference is automatically detected from your system settings (English, Simplified Chinese, or Traditional Chinese)
- **Default Bible Version**: Configure your preferred Bible version (e.g., 和合本, ESV, NIV)
- **Theme Selection**: Choose between System, Light, or Dark theme

### Adding Verses
1. Click **"Add Verse"** button
2. Enter the Chinese verse text
3. Enter the book name (autocomplete available)
4. Enter chapter and verse numbers
5. Enter pinyin initials for the verse and book name
6. Optionally add to a collection
7. Click **"Save Verse"**

### Learning Mode
1. Click **"Learn"** button
2. Select a verse from the dropdown
3. Progress through three stages:
   - **Basic**: See full text, type initials
   - **Intermediate**: See alternating characters
   - **Advanced**: Type from memory
4. Type the pinyin initials to complete the verse

### Review Mode
1. Click **"Review"** button
2. Select verses or a collection to review
3. Choose your review mode:
   - **Individual Mode**: Review verses one at a time with full feedback and accuracy tracking
   - **Single-Text Mode**: Review multiple verses as one continuous passage
4. The app uses spaced repetition to optimize learning and schedule reviews

### Organize Verses in Collections
1. Click **"Collections"** button
2. Create collections to organize verses by topic or passage (a verse can be in more than one collection)
3. Add verses to collections
4. Review entire collections at once with either individual or single-text mode
5. Use collections for themed study or sequential passages


## 🔒 Privacy & Data

- **Local Storage Only**: All data is stored locally in your browser's localStorage
- **No Server Communication**: No data is sent to any server
- **Regular Backups**: Export your data regularly as backup using the Export & Import feature
- **Smart Import Merging**: When importing verses that already exist, the version with the most recent review date is automatically kept to preserve your progress
- **Selective Export**: Export all verses or specific collections, with options to include/exclude review data
- **Clear All Data**: Option available in Settings to completely reset the app (use with caution - this action cannot be undone)

## 🌐 Browser Compatibility

- ✅ Chrome/Edge (Desktop & Mobile) - Full support
- ✅ Safari (iOS & macOS) - Full support
- ✅ Firefox (Desktop & Mobile) - Full support
- ✅ Samsung Internet - Full support

## 📝 File Structure

```
CBM InProgress/
├── index.html          # Main HTML file
├── style.css           # Styles with theme support
├── script.js           # Application logic
├── manifest.json       # PWA manifest
├── sw.js              # Service worker for offline support
├── icons/             # App icons (multiple sizes)
│   ├── icon.svg       # Source SVG
│   └── icon-*.png     # Generated PNG icons
├── generate-icons.html # Browser-based icon generator
├── generate-icons.sh  # Shell script for icon generation
└── readme.txt         # This file
```

## 🆘 Troubleshooting

### App Won't Install
- Ensure you're using HTTPS (or localhost for testing)
- Check that manifest.json and sw.js are accessible
- Verify all icon files exist in the icons/ folder
- Clear browser cache and try again

### Offline Mode Not Working
- Check that service worker registered successfully (browser console)
- Ensure you've visited the app at least once online
- Try force-refreshing the page (Ctrl+Shift+R or Cmd+Shift+R)

### Icons Not Showing
- Verify all PNG files are in the icons/ folder
- Check file names match manifest.json
- Generate icons using generate-icons.html

### Data Lost
- Export your data regularly using Export & Import feature
- Data is stored in browser localStorage (browser-specific)
- Clearing browser data will delete app data

## 🤝 Support

For issues or questions, refer to the app's repository or documentation.

## 📄 License

Copyright © 2025 TzIsf62C

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

**Enjoy memorizing Scripture! 愿主赐福给你！**
