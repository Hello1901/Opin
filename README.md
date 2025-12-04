# Opin - Voting Made Simple

![Opin Logo](public/logo.png)

A modern, real-time voting application built with vanilla JavaScript and Firebase. Create polls, share them with unique links, and visualize results with beautiful charts.

**Live Demo:** [https://opin-voting.web.app](https://opin-voting.web.app)

---

## ✨ Features

### 🔐 Authentication
- Email & password registration and login
- "Keep me logged in" option for persistent sessions
- Secure Firebase Authentication

### 📊 Create Opins (Polls)
- Give your poll a name and question
- Add unlimited options (minimum 2)
- Set expiration date & time for automatic closing
- **Multi-select voting** - Let voters choose multiple options with a configurable maximum
- **Anonymous voting** - Hide voter identities for sensitive topics

### 🔗 Sharing
- Each Opin gets a unique 8-character link (e.g., `/vote/xK9mP2nQ`)
- Share via copy button
- Voters must log in to vote (prevents duplicate votes)

### 📈 Real-time Management
- **Active** - Poll is open for voting (green indicator)
- **Paused** - Temporarily stop accepting votes (yellow indicator)
- **Ended** - Poll is closed permanently (red indicator)
- Pause and reactivate polls anytime
- Polls auto-end when expiration date passes

### 📉 Results & Analytics
- Beautiful bar chart visualization
- View voter emails per option (for non-anonymous polls)
- Graph available for all statuses (view-only for active/paused)

### 📤 Export Options (Ended polls only)
- **PNG** - High-quality image export
- **JPG** - Compressed image export
- **Excel (.xlsx)** - Full data with percentages
- **Google Sheets** - CSV download for easy import

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Build Tool:** Vite
- **Backend:** Firebase (Authentication, Firestore)
- **Hosting:** Firebase Hosting
- **Charts:** Canvas API
- **Excel Export:** SheetJS (xlsx)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Firebase account

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/opin.git
cd opin

# Install dependencies
npm install

# Run development server
npm run dev
```

### Deployment

```bash
# Build for production
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

---

## 🔧 Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Email/Password** authentication
3. Create a **Firestore Database**
4. Add security rules (see `firestore.rules`)
5. Update `src/firebase.js` with your config

---

## 📁 Project Structure

```
opin/
├── public/
│   └── logo.png
├── src/
│   ├── main.js          # App entry point & UI logic
│   ├── style.css        # Complete styling
│   ├── firebase.js      # Firebase configuration
│   ├── auth.js          # Authentication functions
│   ├── opins.js         # Poll CRUD operations
│   ├── voting.js        # Vote submission & tracking
│   ├── graph.js         # Chart rendering & exports
│   ├── notifications.js # Toast notification system
│   └── loader.js        # Loading spinner overlay
├── index.html
├── package.json
├── vite.config.js
├── firebase.json
└── .firebaserc
```

---

## 🎨 Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Black | `#000000` | Primary background |
| Dark Gray | `#222222` | Secondary background, cards |
| Teal | `#1DCD9F` | Primary accent, buttons |
| Dark Teal | `#169976` | Gradients, hover states |

---

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Made with ❤️ using Firebase
