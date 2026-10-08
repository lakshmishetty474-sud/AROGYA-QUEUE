# Login background image

Place your hospital photograph here as:

```
public/assets/hospital-login-bg.jpg
```

That exact path is already wired into the login screen at 0.3 opacity.

**Nothing breaks while this file is missing.** The login page renders a
professional medical-gradient surface underneath, so it looks intentional
either way. Drop the file in and the photograph fades in automatically — no code
change, no rebuild needed for dev (Vite serves `public/` straight).

## Recommended image

- **Wide landscape**, 1920x1080 or wider — it sits behind a centred card
- Bright, calm hospital interior: reception, corridor, ward, or nursing station
- **Light and airy.** It is shown at 0.3 opacity, so a busy or dark photo turns
  into visual noise behind the form
- Avoid strong faces or readable signage at the centre — the card covers it
- Under ~400 KB keeps first paint fast

## Note on the uploaded logo

A logo (the square AROGYA QUEUE app icon) was attached in chat, but chat
attachments are not written into the project. If you want it placed here too —
for example as a small brand mark on the login card — save it as:

```
public/assets/arogya-logo.png
```

PDF reports already render a vector-drawn AROGYA QUEUE emblem, so reports are
branded with or without this file. When this file exists, PDFs automatically
embed the real image instead of the vector mark.