# Eeja Agency Website — Live karne aur khud edit karne ki Guide 🇮🇳
### (Zero coding, Zero paisa — sirf clicks)

Tumhari site ab aisi ban gayi hai: **text, photo, project — sab browser me badlo,
Save dabao, 1 minute me live site update.** Na server, na kharcha.

Isme 3 hisse hain — **A: GitHub** (files rakhne ki jagah), **B: Cloudflare**
(site live karne ki jagah, FREE), **C: Admin panel** (edit karne ki jagah).

---

## A. Files GitHub par daalo (ek baar karna hai)

**Chahiye:** GitHub account (hai) + [GitHub Desktop app](https://desktop.github.com/)
(free, install kar lo).

1. GitHub Desktop kholo → **File → Add Local Repository** → ye folder chuno:
   `Documents / Eeja Agency / Eeja-Agency` → **Add Repository** dabao.
2. Upar **Publish repository** dabao → naam rakho `eeja-agency` → **Public**
   chuno (public free hai; private me Pages + CMS me dikkat aati hai) →
   **Publish Repository**.
3. Bas! Saari files GitHub par chali gayin. (Roughly 2–5 minute lagenge,
   photos/videos ki wajah se.)

> `dist/` folder upload nahi hoga — woh automatic banta hai, fikar mat karo.

---

## B. Cloudflare Pages par site LIVE karo (ek baar karna hai, FREE)

1. [dash.cloudflare.com](https://dash.cloudflare.com/) par **free account** banao
   (sirf email chahiye).
2. Left me **Workers & Pages → Create → Pages → Connect to Git** →
   **GitHub** connect karo aur `eeja-agency` repo chuno.
3. **Set up builds** me ye likho (bilkul exact):
   - Framework preset: **None**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: khaali chhodo
4. **Save and Deploy** dabao → 1–2 minute me site live:
   `https://eeja-agency.pages.dev` (naam thoda alag ho sakta hai).
5. Khol ke check karo — site bilkul pehle jaisi dikhni chahiye.

## B2. Ek chhota setting (taaki admin tumhara repo pehchane)

1. [github.com](https://github.com/) par apna `eeja-agency` repo kholo →
   `admin` folder → `config.yml` file kholo → **pencil ✏️ (Edit)** dabao.
2. Upar ye line milegi:
   `repo: OWNER/REPO`
   Isko badal ke likho: `repo: TUMHARA-USERNAME/eeja-agency`
   (jaise `repo: rahul-sharma/eeja-agency`)
3. Neeche **Commit changes** dabao. 1 minute me Cloudflare dobara deploy karega.

---

## C. Admin panel me LOGIN (ek baar karna hai)

1. Apni site kholo aur aakhir me `/admin` jodo, jaise:
   `https://eeja-agency.pages.dev/admin`
2. **Sign In with Token** dabao. (Token ek password jaisa hota hai.)
3. Token banane ke liye: [github.com/settings/tokens](https://github.com/settings/tokens)
   kholo → **Generate new token → Generate new token (classic)** →
   Note me `eeja-admin` likho → neeche **`repo`** wala dabba ✅ tick karo →
   **Generate token** → jo code dikhe **copy** kar lo.
   (Ye code dobara nahi dikhega — sambhal ke rakho!)
4. `/admin` page par wapas aake token **paste** karo → andar! 🎉
   (Browser yaad rakhega — baar-baar nahi mangega.)

---

## D. Roz ka kaam — EDIT karna (bahut aasan)

`/admin` kholo → left me 4 dibbe dikhenge:

| Dibba | Kya badal sakte ho |
|---|---|
| **Site Settings** | Logo, menu ke naam, footer, address, phone, social links — jo har page par dikhta hai |
| **Pages** | Har page ka apna text — Home, Agency, Contact… kholo, likho, save |
| **Project detail pages** | 8 project pages ka text (jaise Son of a Tailor page ke shabd) |
| **Projects** | Project **cards** — naam, photo, category, saal. **＋ se naya project**, 🗑️ se delete, upar-neeche karke order badlo |

**Photo badalne ke liye:** image wale khaane par click → **Upload** → apni photo
chuno. Nayi photo `assets/images/uploads/` me save hogi, purani safe rahegi.

**Save karne ke baad:** upar **Publish** dabao → 1 minute ruko → live site par
dekho. ✅

### Naya project add karna (example)
1. **Projects → ＋ Add** → Title: `Mera Naya Kaam`
2. **slug**: `mera-naya-kaam` (sirf chhote akshar + `-`, space mat do!)
3. **hero** aur **thumb** me 2 photos upload karo.
4. **featured** ✅ karoge to Home page ke slider par bhi aayega.
5. **next_slug**: aakhri project ka slug likho taaki "Next Project" ka
   chakkar na toote (jaise `vx-lab`). Aur `vx-lab` wale ka `next_slug`
   badal ke `mera-naya-kaam` kar do.
6. Publish → card teeno-chaaro jagah (Home, Portfolio, Highlights,
   Playground) apne aap ban jayega!

> ⚠️ Naye project ka **detail page** (andar khulne wala page) apne aap nahi
> banta. Uske liye kisi purani `portfolio-*.html` file ki copy banao aur naam
> `portfolio-mera-naya-kaam.html` rakho (slug se milna chahiye). Uske baad uska
> text/photos sab admin se badal sakte ho. Confusion ho to developer se poochho.

---

## E. Apna domain lagana (optional, FREE)

Domain hai (jaise `eejaagency.com`)? Cloudflare me **Pages project →
Custom domains → Set up a custom domain** → naam likho → Done. SSL (🔒)
apne aap lag jayega.

---

## ⚠️ Savdhaaniyan (zaroor padho)

1. **slug kabhi mat badlo** jab tak file ka naam bhi na badlo — link toot jayega.
2. **Video 25MB se chhoti** rakho (Cloudflare ki limit hai).
3. Month me **500 baar Publish** free hai — roz 10 baar bhi chalega, aaram se.
4. `content/` folder ki files haath se mat bigado — sab admin se karo.
5. Kuch gadbad ho jaye to: GitHub repo → **Commits history** me purana version
   wapas la sakte ho — kuch delete nahi hota. ✅
6. Admin me jo gadbad lage, uska screenshot le ke developer ko bhejo.

**Kharacha: ₹0. Coding: 0. Bas clicks.** 🚀
