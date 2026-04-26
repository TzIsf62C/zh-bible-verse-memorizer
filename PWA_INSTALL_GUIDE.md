# PWA Installation Guide for iOS

## ✅ PWA is now ready!

The production build is running on **port 8080** with:
- Service Worker v0.9.5
- Updated manifest.json
- Proper offline caching
- Standalone display mode

---

## 📱 How to Install on iPhone (iOS Safari)

### Step 1: Get the Correct URL
1. In VS Code, open the **PORTS** tab (bottom panel)
2. Find port **8080** (NOT 5173!)
3. Make sure visibility is set to **Public**
4. **Copy the forwarded URL** (something like `https://xyz-8080.preview.app.github.dev`)

### Step 2: Open in Safari
1. **Open Safari** on your iPhone (must be Safari, not Chrome)
2. **Paste the port 8080 URL** and navigate to it
3. Wait for the app to fully load

### Step 3: Add to Home Screen
1. Tap the **Share button** (square with arrow up) at the bottom of Safari
2. Scroll down and tap **"Add to Home Screen"**
3. The app icon and name "聖經背誦" should appear
4. Tap **"Add"** in the top right

### Step 4: Launch as PWA
1. Go to your home screen
2. Tap the **聖經背誦** icon
3. The app should open in **standalone mode** with:
   - ✅ NO URL bar at top
   - ✅ NO browser controls at bottom
   - ✅ Full screen app experience
   - ✅ Offline functionality

---

## 🔍 Key Differences

| Feature | Browser View | PWA (Home Screen) |
|---------|--------------|-------------------|
| URL bar | ✅ Visible | ❌ Hidden |
| Browser controls | ✅ Visible | ❌ Hidden |
| Looks like | Website | Native app |
| Offline support | ⚠️ Limited | ✅ Full |
| Returns to | Safari | App itself |

---

## 🐛 Troubleshooting

### "Data - Zero KB" Error
- **Cause**: You're accessing the dev server (port 5173) which is offline
- **Fix**: Use the port 8080 URL instead

### App shows URL bar
- **Cause**: Opened in Safari browser, not from home screen
- **Fix**: Install using "Add to Home Screen" and launch from there

### Service worker not caching
- **Check**: Open Safari DevTools (connect to Mac) and check Console
- **Clear**: Delete the home screen app, clear Safari cache, reinstall

### Screen autoscroll issues
- This may be a SvelteKit routing issue - test in the PWA version
- If still present, may need to adjust CSS or add scroll behavior

---

## 🔄 To Update the PWA

When you make code changes:

\`\`\`bash
# 1. Rebuild
BASE_PATH='' npm run build
cd build && cp 404.html index.html && cd ..

# 2. Update service worker version in static/sw.js
# Change: const CACHE_NAME = 'zh-bible-memorizer-v0.9.6';

# 3. Restart server (if needed)
pkill -f "python3 -m http.server 8080"
./serve-pwa.sh
\`\`\`

On your phone:
1. Delete the home screen app icon
2. Clear Safari cache
3. Reinstall using the steps above

---

## Current Server Status

✅ PWA Build Server running on port **8080**
✅ Service Worker version **0.9.5**
✅ Manifest updated with correct paths
✅ Ready for testing

**Next**: Get the port 8080 URL from VS Code Ports tab and install on your iPhone!
