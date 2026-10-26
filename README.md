# The Popsy Bar

Next.js 16 (App Router) · TypeScript · Tailwind 4 · Supabase (content + auth) · Cloudinary (images) · FormSubmit (inquiry email)

## 1. Install and run

```bash
npm install
cp .env.example .env.local      # then fill in the blanks (section 2)
npm run dev                     # http://localhost:3000
npm run lint
npm run build && npm run start
```

The public site works with **no** environment variables: it shows its built-in content and photos. Supabase and Cloudinary are only needed for `/admin`, saved edits and uploads.

## 2. Environment variables

Put these in `.env.local` locally, and in your host's environment settings (e.g. Vercel → Project → Settings → Environment Variables), then redeploy.

| Variable | Public? | Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | `https://sapydmabiajxeuudkhmc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | the publishable key (already in `.env.example`; it is designed to be public) |
| `CLOUDINARY_CLOUD_NAME` | **server only** | copy from the Cloudinary dashboard (see section 4) |
| `CLOUDINARY_API_KEY` | **server only** | `113279465715572` |
| `CLOUDINARY_API_SECRET` | **server only** | your (new, rotated) secret. Never add `NEXT_PUBLIC_` to this |

The Supabase service-role key is **not used anywhere** and must never be added.
`.env.local` is git-ignored; `.env.example` is committed and contains no secrets.

## 3. Supabase setup (run in this order)

1. **Create the tables, security rules and starter photos.** Supabase Dashboard → SQL Editor → New query → paste all of `supabase/schema.sql` → Run. (Safe to re-run.)
2. **Create your admin login.** Dashboard → Authentication → Users → *Add user → Create new user*. Enter the admin's email and a strong password **you choose** (tick *Auto Confirm User*). Nothing is pre-set by the site.
3. **Make that user an admin.** Open `supabase/make-admin.sql`, replace `REPLACE_WITH_ADMIN_EMAIL` with that email, paste into the SQL Editor and Run. It should return one row.
4. Go to `/admin/login` and sign in.

How access works: only users listed in `public.admins` count as administrators. Row Level Security lets the public **read** content and visible gallery photos, and only admins **write**. Every admin page and server action re-checks this, so a hidden link is not the protection. To add a second admin, repeat steps 2–3. To remove one, `delete from public.admins where user_id = '…'`.

Tables: `admins`, `site_content` (text/link/image edits), `section_settings` (order + visibility), `gallery_images`.

Until the SQL is run the site keeps working from its built-in content, and `/admin` shows a clear "tables missing" message.

## 4. Cloudinary setup

1. In the Cloudinary dashboard find **Cloud name** (Dashboard / Settings → API Keys area). The value `uwr3jend` you supplied was *not* verified as the cloud name; I could not check your dashboard. Put the confirmed value in `CLOUDINARY_CLOUD_NAME`. Uploads stay disabled (with a clear message) until it is set.
2. **Rotate the API secret** you pasted into chat: Cloudinary → Settings → API Keys → generate a new key/secret (or regenerate the secret), then put the new secret only in `.env.local` / your host. Treat the old one as compromised. If you generate a *new key pair*, update `CLOUDINARY_API_KEY` too.
3. Uploads use a **signed** direct upload: the browser asks `/api/admin/cloudinary/sign` (admins only) for a short-lived signature; the secret never leaves the server. Files go to the `popsy-bar/` folder. Allowed: JPEG, PNG, WebP, AVIF, max 10 MB. The old image is deleted only **after** the replacement is saved.
4. `next.config.ts` allows `res.cloudinary.com` for `next/image`.

Free plan note: Cloudinary's free plan uses a shared monthly credit allowance, so storage, bandwidth and transformations all count toward it. Check your plan's current limits in the dashboard.

## 5. Inquiry emails (FormSubmit)

Every form (Contact, Plan Your Event, homepage inquiry; the Design-your-cart choice is attached to the homepage/plan inquiry) posts to `https://formsubmit.co/ajax/farhandeveriux@gmail.com`. Change the address in `src/lib/site-config.ts` (`FORM_SUBMIT_EMAIL`).

**One-time activation (required):** the first submission to a new address makes FormSubmit email an activation link to that inbox. Until that link is clicked, messages are **not delivered**, and the site reports that as a failure, never as success.
1. Open the live site → Contact page → submit a test inquiry.
2. Open the farhandeveriux@gmail.com inbox (check spam) → click the activation link in FormSubmit's email.
3. Submit another test and confirm it arrives. The form shows "sent" only when FormSubmit's response confirms it.

Spam protection: hidden honeypot field + minimum fill time. Required fields use browser validation; typed values are kept if sending fails. Not verified here: actual delivery needs your live activation.

## 6. Using the admin

- **/admin** dashboard: connection status, shortcuts.
- **Page content** (Homepage, About, Events, Contact, Plan Your Event, Gallery text, Occasion cards, Footer, Experience pages): every heading, paragraph, button label/link and image is a field. Wrap words in `*asterisks*` for the italic accent style. *Reset to original* restores the built-in text.
- **Sections:** Homepage, About and each experience page have an *order and visibility* panel (arrows + Visible checkbox).
- **Gallery & categories:** occasions come from `src/lib/occasions.ts` (so names always match the site). Per occasion: upload, replace, delete, reorder, hide, edit alt text, and tick *Show on homepage* for the homepage strip. Reorder/hide whole occasions at the top. Occasion descriptions are under *Gallery page* text.
- Changes are saved to Supabase and the site is revalidated immediately (public pages also refresh at most every 5 minutes).

## 7. What changed

- **Address and map:** `src/lib/site-config.ts` is the single source (`2717 FM 2218 Rd, Rosenberg, TX 77469, USA` + the map embed). Used in the footer, Contact, Plan Your Event and JSON-LD structured data. The old "Houston & surrounding areas" text was replaced. (The About story still says "Houston-born", which is biography, not the address.)
- **Hero:** the fade came from the cream scrim `.hero-bg::after` (alpha 0.92→0.55). It is now 6% (photos ≈94%), and the text sits on a subtle cream panel (`.hero__text`) for readability.
- **New pages:** `/gallery` (per-occasion sections, working *View More*), `/plan-your-event`. Added to the header (Gallery; Plan Your Event button), mobile menu and footer.
- **Removed (confirmed unused):** root `lib/` folder (a stale duplicate `occasions.ts` and unused `experience-images.ts`), `src/components/HeroBackground.tsx`, `src/data/*`.
- **Gallery photos:** only existing images are used. Cultural Celebration and Graduation have no photo yet and show "More photos soon." Several occasions have fewer than 4 photos, so *View More* appears only where there are more than 3.

## 8. Files

Created: `supabase/schema.sql`, `supabase/make-admin.sql`, `.env.example`, `src/proxy.ts`, `src/lib/{admin,cloudinary,slug,local-images}.ts`, `src/lib/supabase/*`, `src/lib/cms/*`, `src/lib/forms/*`, `src/app/admin/**`, `src/app/api/admin/cloudinary/sign/route.ts`, `src/app/gallery/page.tsx`, `src/app/plan-your-event/page.tsx`, and components `Rich`, `SmartLink`, `FormFeedback`, `BusinessMap`, `ContactForm`, `EventInquiryForm`, `CartDesignForm`, `GalleryCategory`, `SiteChrome`, `admin/*`.
Modified: `next.config.ts`, `.gitignore`, `src/app/{layout,page,globals.css}`, About/Events/Contact pages, `src/lib/site-config.ts`, `Header`, `Footer`, `PrimaryNav`, `MobileNav`, `Hero`, `ValueStrip`, `Services`, `Occasions`, `CartDesigner`, `Gallery`, `About`, `InquiryForm`, `ExperienceCategoryPage`.

## 9. Known limits

- Photos added to `/public/images` must also be listed in `src/lib/local-images.ts`.
- Page text editing covers headings, paragraphs, labels, links and images on every page; navigation labels, the experience chip lists and the cart designer's option lists are still in code.
- The About page's second story paragraph is a placeholder note ("This page is an editable introduction…"). Replace it from `/admin` before launch.
- Homepage hero slides: `hero-bg-5.jpeg` does not exist, so the slideshow uses four.
