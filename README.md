<div align="center">

<!-- HERO BANNER -->
<img width="100%" src="https://capsule-render.vercel.app/api?type=venom&color=0:0f0c29,50:302b63,100:24243e&height=280&section=header&text=Problem2Project&fontSize=72&fontColor=00f5ff&fontAlignY=45&desc=VIT-Voice%20%E2%80%94%20The%20Social%20%26%20Academic%20OS%20for%20VIT%20Students&descSize=18&descAlignY=68&descColor=ffffff&animation=twinkling&stroke=00f5ff&strokeWidth=2"/>

<br/>

<!-- LIVE BADGE -->
<a href="https://vit-voice.vercel.app" target="_blank">
  <img src="https://img.shields.io/badge/%F0%9F%9A%80%20LIVE%20NOW-vit--voice.vercel.app-00f5ff?style=for-the-badge&labelColor=0a0a0f&color=00f5ff"/>
</a>

<br/><br/>

<!-- TECH STACK BADGES -->
<img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white&labelColor=000000"/>
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=1a1a2e"/>
<img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white&labelColor=0f172a"/>
<img src="https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black&labelColor=1a1a2e"/>
<img src="https://img.shields.io/badge/Framer_Motion-Latest-E700FF?style=for-the-badge&logo=framer&logoColor=white&labelColor=0a0a0f"/>
<img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white&labelColor=111111"/>

<br/><br/>

<!-- TAGLINE -->
*Where campus struggles become portfolio-worthy solutions.*

<br/>

---

</div>

## ✦ What is Problem2Project?

**Problem2Project** (also known as **VIT-Voice**) is the **ultimate social and academic operating system** built exclusively for students at Vellore Institute of Technology. It exists at the intersection of campus culture, collaborative engineering, and academic excellence.

The core philosophy is simple but powerful: **every campus problem is a project waiting to happen.** Instead of complaints disappearing into a void, VIT-Voice transforms them into real, collaborative, portfolio-worthy tech projects — built by students, for students.

> *From messy mess queues to broken WiFi in labs — if it's a problem at VIT, it becomes a project here.*

<br/>

---

## ◈ The Dual Experience

VIT-Voice operates as two deeply integrated yet visually distinct modes, each with its own branding identity and purpose.

<br/>

### ❮ ❯ Mode 01 — Campus Life `#00f5ff Cyan`

> *The pulse of the campus. Intelligence without identity.*

The **social heartbeat** of VIT-Voice, Campus Life Mode is where 18,000+ students connect, vent, and discover — anonymously and fearlessly.

| Feature | Description |
|---|---|
| 🕵️ **Anonymous Campus Intelligence** | Post, discuss, and surface campus issues with full anonymity. No names, no judgment. |
| ⚡ **Karma Economy** | A reputation system that rewards quality contributions. Upvotes, badges, and real social capital. |
| 📢 **Real-Time Placement Alerts** | Live ticker of placement drives, interview rounds, and offer announcements from the community. |
| 🌐 **Smart Social Networking** | Discover peers by branch, year, hostel, and interest. Network smarter, not harder. |

<br/>

### ❮ ❯ Mode 02 — Growth Mode `#ff2d78 Pink`

> *Where academic pain becomes engineering gain.*

The **academic powerhouse** of VIT-Voice. Growth Mode turns student struggles into structured, collaborative tech projects — complete with teams, timelines, and outcomes.

| Feature | Description |
|---|---|
| 🤝 **Problem-to-Project Pipeline** | Submit a campus struggle. The community votes. The best ones become real projects with open teams. |
| 🤖 **AI-Assisted Study Tools** | Intelligent flashcard generation, syllabus breakdown, and personalized revision plans. |
| 📅 **Smart Schedule Generator** | Auto-builds a study/project schedule from your courses, deadlines, and free slots. |
| 📊 **Real-Time Performance Tracker** | Live analytics on your academic and project contributions. See your growth, week over week. |

<br/>

---

## ✦ UI / UX Design Language

VIT-Voice is not just functional — it's a **visual experience**. The design language is intentional, consistent, and unapologetically bold.

```
Theme:        Permanently Forced Dark Mode — no light mode exists, no compromise.
Aesthetic:    Cosmic Futurism — a living universe rendered in code.
Palette:      Deep space blacks → midnight purples → electric cyans → neon pinks
```

**Design Pillars:**

- 🌌 **Live 3D Background Grid** — An interactive, perspective-shifted grid that responds to mouse movement, creating a sense of infinite depth.
- ☄️ **Animated Shooting Stars** — Randomly generated star trails that zip across the viewport with varied speeds, sizes, and opacity — pure parallax atmosphere.
- 🪟 **Frosted Glass Components** — Every card, modal, and panel uses `backdrop-blur` with translucent borders for a premium glassmorphism finish.
- ✨ **Neon Glow System** — Tailwind-extended utilities for consistent `box-shadow` and `text-shadow` glow effects in Cyan (`#00f5ff`) and Pink (`#ff2d78`).
- 🎞️ **Framer Motion Choreography** — Staggered page transitions, spring-based hover interactions, and orchestrated entry animations throughout.

<br/>

---

## ✦ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | SSR, routing, performance |
| **Language** | TypeScript | Type safety, developer experience |
| **Styling** | Tailwind CSS v4 | Utility-first, custom design tokens |
| **Animations** | Framer Motion | Page transitions, spring physics |
| **Backend** | Firebase Firestore | Real-time live data, counters |
| **Auth** | Firebase Auth | Secure VIT student identity |
| **Hosting** | Vercel | Edge deployment, CI/CD |

<br/>

---

## ✦ Project Structure

```
problem2project/
├── app/                        # Next.js App Router
│   ├── (campus-life)/          # Campus Life Mode routes (Cyan)
│   ├── (growth)/               # Growth Mode routes (Pink)
│   ├── layout.tsx              # Root layout + forced dark mode
│   └── page.tsx                # Landing page
├── components/
│   ├── ui/                     # Shared glassmorphism components
│   ├── background/             # 3D grid + shooting stars
│   ├── campus-life/            # Mode-specific components
│   └── growth/                 # Mode-specific components
├── lib/
│   ├── firebase.ts             # Firebase initialization
│   └── utils.ts                # Shared utilities
├── hooks/                      # Custom React hooks
├── types/                      # Global TypeScript types
├── public/                     # Static assets
└── tailwind.config.ts          # Extended Tailwind with neon tokens
```

<br/>

---

## ✦ Getting Started Locally

Follow these steps to spin up VIT-Voice on your machine.

### Prerequisites

Make sure you have the following installed:

```bash
Node.js  >= 18.x
npm      >= 9.x   (or pnpm / yarn)
Git      >= 2.x
```

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/problem2project.git
cd problem2project
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Then fill in your Firebase credentials:

```env
# .env.local

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

> Get these values from your [Firebase Console](https://console.firebase.google.com) → Project Settings → Your Apps.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The cosmic experience begins. 🚀

### 5. Build for Production

```bash
npm run build
npm run start
```

<br/>

---

## ✦ Deployment

VIT-Voice is deployed on **Vercel** with automatic CI/CD on every push to `main`.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/problem2project)

> **Live URL:** [https://vit-voice.vercel.app](https://vit-voice.vercel.app)

<br/>

---

## ✦ Contributing

VIT-Voice is built *by* VIT students, *for* VIT students. Contributions are welcome.

```bash
# 1. Fork the repository
# 2. Create your feature branch
git checkout -b feat/your-feature-name

# 3. Commit your changes (follow Conventional Commits)
git commit -m "feat: add anonymous post voting system"

# 4. Push and open a Pull Request
git push origin feat/your-feature-name
```

Please read `CONTRIBUTING.md` before submitting a PR.

<br/>

---

## ✦ Roadmap

- [x] 🌌 Landing page with 3D grid and shooting stars
- [x] 🎨 Dual-mode design system (Cyan / Pink)
- [x] 🔥 Firebase Firestore live stats integration
- [ ] 🕵️ Anonymous post system with karma voting
- [ ] 🤖 AI study tool integration (Gemini API)
- [ ] 📱 Mobile-responsive layout pass
- [ ] 🔔 Real-time notification system
- [ ] 👥 Team formation for projects

<br/>

---

<div align="center">

---

<br/>

**Built with obsession at VIT Vellore.**

*Every great product starts with a problem.*
*This one started with 18,000 of them.*

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f0c29,100:00f5ff&height=100&section=footer&reversal=false"/>

</div>
