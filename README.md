# MN Looms Handloom — React (JSX) website

Vite + React 18 + Tailwind CSS 3. Recreated from your MN Looms site: hero, story, collection with filters
and quick view, how-it-works, custom-order form, testimonials, gallery, FAQ, contact footer, WhatsApp button.
A working **Admin** button sits in the footer.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production files in /dist
npm run preview    # preview the production build
```

## Admin

Click **Admin** in the footer, then log in with the values in `.env`:

```
VITE_ADMIN_USER=vinay_m
VITE_ADMIN_PASS="Vinay@#123"
```

Change the password, then restart `npm run dev`. Dashboard tabs: Dashboard, Orders (status + delete),
Products (edit / add / delete), Settings (business name, tagline, WhatsApp, Instagram, phone, location, about),
Enquiries.

Set your WhatsApp number (digits with country code, e.g. `919876543210`) and Instagram link under
Admin → Settings and every button updates.

### Important limits

- The admin login is checked in the browser, so anyone who inspects the built site can read the password.
  Treat it as a convenience lock, not real security.
- Data is saved in `localStorage` (see `src/lib/api.js`). It stays in the browser that created it, so a
  customer's custom order is **not** visible on your device. To receive orders from visitors, replace the
  body of `api()` in `src/lib/api.js` with calls to Firebase, Supabase or your own server. Its actions are
  `records.list`, `records.create`, `records.replace` and `records.delete`, so nothing else needs to change.
  For real login security, move the admin check to that backend as well.

## Structure

```
src/
  App.jsx               page layout, state, admin dashboard, login
  components/           Reveal, HeroCanvas, LoomCanvas
  data/                 default products / settings / FAQs / images
  lib/                  api.js (storage layer), helpers.js (WhatsApp / Instagram links)
  assets/               photos and logo
  index.css             theme colours, fonts, animations
```

Product photos are chosen from the three bundled images (`img-1`, `img-2`, `img-3`). Replace those files to
change them.
