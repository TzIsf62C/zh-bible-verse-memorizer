# ZH Bible Verse Memorizer PWA

A Progressive Web App for memorizing Chinese Bible verses with spaced repetition.

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
3. Choose difficulty level:
   - **Basic**: See full text, type initials
   - **Intermediate**: See alternating characters
   - **Advanced**: Type from memory
4. Type the pinyin initials to complete the verse

### Review Mode
1. Click **"Review"** button
2. Select verses or a collection to review
3. The app uses spaced repetition to optimize learning

### Collections
1. Click **"Collections"** button
2. Create collections to organize verses by topic
3. Add verses to collections
4. Review entire collections at once

## 🔧 Technical Setup

### Prerequisites
- A web server (local or remote)
- Modern web browser with PWA support

### Generating Icons

You need to generate the PWA icons before deploying:

**Option 1: Using the HTML Generator (Recommended)**
1. Open `generate-icons.html` in your browser
2. Click "Generate All Icons"
3. Save all downloaded PNG files to the `icons/` folder

**Option 2: Using Command Line (requires ImageMagick or librsvg)**
```bash
# Install dependencies (macOS)
brew install librsvg

# Generate icons
./generate-icons.sh
```

**Option 3: Manual Creation**
Use any image editor to create PNG files from `icons/icon.svg` at these sizes:
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

### Local Testing

1. **Simple HTTP Server (Python)**
   ```bash
   # Python 3
   python3 -m http.server 8000
   
   # Then visit: http://localhost:8000
   ```

2. **Node.js HTTP Server**
   ```bash
   npx http-server -p 8000
   
   # Then visit: http://localhost:8000
   ```

3. **VS Code Live Server**
   - Install "Live Server" extension
   - Right-click `index.html`
   - Select "Open with Live Server"

### Deployment

#### GitHub Pages
1. Create a new repository
2. Upload all files
3. Go to Settings → Pages
4. Select main branch and save
5. Access at `https://username.github.io/repo-name`

#### Netlify
1. Drag and drop the folder to Netlify
2. Or connect your Git repository
3. Deploy automatically

#### Vercel
```bash
npm i -g vercel
vercel
```

## 🔒 Privacy & Data

- All data is stored locally in your browser's localStorage
- No data is sent to any server
- Export your data regularly as backup using the Export feature

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

This app is provided as-is for personal use.

---

**Enjoy memorizing Scripture! 愿主赐福给你！**
