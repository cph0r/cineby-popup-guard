# Cineby Popup Guard

Watching on [cineby](https://cineby.my) and every click opens an ad in a new tab? This fixes it.

It blocks the pop-up and pop-under ads on cineby, removes the invisible layers that steal your first click, and closes any ad tab that still gets through. Works on desktop (Chrome, Edge, Brave) and on mobile (iPhone Safari, Android Firefox).

---

## 💻 Desktop: Chrome, Edge or Brave

1. **Download** this repo: click the green **Code** button above → **Download ZIP**.
2. **Unzip** it. You'll get a folder called `cineby-popup-guard-main`.
3. Open a new tab and go to:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
4. Turn on **Developer mode** (toggle in the top-right corner; in Edge it's in the left sidebar).
5. Click **Load unpacked** and select the unzipped `cineby-popup-guard-main` folder.
6. You should now see **Cineby Popup Guard** in the list. Click the puzzle-piece icon in the toolbar and pin it so you can see it.
7. **Reload** any open cineby tab, then play a movie and click around.

When the extension blocks an ad, its icon shows a red number with how many it stopped on that tab.

> Chrome may show a "Disable developer mode extensions" warning on startup. That's normal for extensions installed this way; click the X to dismiss it.

**To update:** download the ZIP again, replace the folder, then click the ↻ reload icon on the extension in `chrome://extensions`.

---

## 📱 iPhone / iPad (Safari)

1. Install the free **[Userscripts](https://apps.apple.com/app/userscripts/id1463298887)** app from the App Store.
2. Open the Userscripts app once and tap **Set Userscripts Directory**. Pick a folder (for example, *On My iPhone → Userscripts*).
3. Go to **Settings → Apps → Safari → Extensions → Userscripts**, turn it **on**, and set **All Websites → Allow**.
4. In Safari, open [`cineby-popup-guard.user.js`](cineby-popup-guard.user.js) here on GitHub and tap **Raw**.
5. Tap the **puzzle-piece / ᴀA icon** in the Safari address bar → **Userscripts** → **Install** (or save the file into the folder from step 2 with the Files app).
6. Open cineby, reload the page and play a movie.

---

## 🤖 Android (Firefox)

> Chrome for Android doesn't support extensions or userscripts, so use Firefox.

1. Install **[Firefox](https://play.google.com/store/apps/details?id=org.mozilla.firefox)** from the Play Store.
2. In Firefox, open **⋮ menu → Extensions** (Add-ons), find **Violentmonkey** and tap **Add**.
3. Open [`cineby-popup-guard.user.js`](cineby-popup-guard.user.js) here on GitHub and tap **Raw**.
4. Violentmonkey opens an install screen. Tap **Install**.
5. Open cineby in Firefox, reload the page and play a movie.

---

## ✅ Check that it's working

- Click the play button and the player controls a few times. No new tabs should open.
- **Desktop:** the extension icon shows a red number when it blocked something. For details, press `F12` → **Console** and type `popup-guard` in the filter box.
- **Mobile:** if an ad tab still opens on the very first tap, close it and reload cineby once; the script is then loaded before the ad code.

## ❓ Troubleshooting

| Problem | Fix |
|---|---|
| Ads still open on desktop | Make sure the extension is enabled in `chrome://extensions`, then fully reload the cineby tab. |
| The movie page reloaded by itself | The ad tried to take over your tab and the extension sent you back. Press play again. |
| A real link (not an ad) won't open | Links from cineby to other websites are blocked on purpose. Right-click → **Copy link** and paste it into a new tab. |
| Nothing happens on iPhone | Check Settings → Safari → Extensions → Userscripts is on and allowed on **All Websites**. |

## 🔒 Privacy

Nothing is collected or sent anywhere. The extension only acts on cineby pages and the video player embedded in them; on every other site it does nothing.

## How it works

- **`content.js`** runs before cineby's own scripts, in the page and inside the embedded video player. It disables `window.open`, blocks clicks on hidden links that would open ads in a new tab, and removes invisible full-screen click-catching layers.
- **`background.js`** (desktop only) closes any new tab that a cineby tab opens to another site, and goes back if the cineby tab itself gets redirected to an ad.
- **`cineby-popup-guard.user.js`** is `content.js` packaged as a userscript for mobile.

## License

MIT
