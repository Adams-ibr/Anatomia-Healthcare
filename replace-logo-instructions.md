# Logo Replacement Instructions

To replace the logo with the Anatomia logo you provided:

## Option 1: Manual Replacement
1. Save the Anatomia logo image you uploaded in the chat
2. Replace these files with the new logo:
   - `/Users/user/Anatomia Healthcare/public/logo.png`
   - `/Users/user/Anatomia Healthcare/public/favicon.png` (use the same or a smaller icon version)

## Option 2: Using Command Line
If you have the logo saved locally, use these commands:

```bash
# Navigate to project directory
cd "/Users/user/Anatomia Healthcare"

# Copy your logo file (adjust the source path)
cp /path/to/your/anatomia-logo.png public/logo.png
cp /path/to/your/anatomia-logo.png public/favicon.png
```

## What's Been Updated

All references to "HamaAcademy" have been changed to "Anatomia" in:

✅ App title in index.html
✅ Package name in package.json
✅ All logo alt text throughout the app
✅ Translation files (brand name)
✅ Capacitor config (app ID and name)
✅ Android strings.xml
✅ All component references

The app is now ready once you replace the logo images!
