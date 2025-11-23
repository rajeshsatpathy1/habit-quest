# ⚔️ Habit Quest

**Habit Quest** is a gamified habit tracker that turns your daily routines into an RPG adventure. Level up your character, gain XP, and track your consistency with a beautiful, modern interface. This was built in Google Anti-Gravity IDE.

**Demo Static App**:
[Habit Quest](https://rajeshsatpathy1.github.io/habit-quest/)

## ✨ Features

-   **Gamified Progression**: Earn XP for completing habits. Level up your hero!
-   **Dynamic XP System**: Higher levels require more XP, keeping the challenge alive.
-   **Soft Delete & History**: Deleting a habit archives it. Your history and XP are preserved.
-   **Autocomplete**: Quickly recreate past habits with smart suggestions.
-   **Calendar View**: Visualize your consistency with a monthly activity calendar.
-   **Responsive Design**: Works great on desktop and mobile devices.
-   **Data Safety**: SQLite database ensures your progress is saved locally.
-   **Advanced Actions**: Feature-flagged "Reset Data" option for starting fresh.

## 🛠️ Tech Stack

-   **Frontend**: React, Vite, Tailwind CSS
-   **Backend**: Node.js, Express
-   **Database**: SQLite

## 🚀 Getting Started

### Prerequisites
-   Node.js (v14+)
-   npm

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd habit-quest-app
    ```

2.  Install dependencies (Root & Client):
    ```bash
    npm install
    cd client && npm install
    cd ..
    ```

### Running the App

1.  **Start the Server** (Production Mode):
    This serves the optimized React build from `client/dist`.
    ```bash
    npm start
    ```
    The app will be available at [http://localhost:3000](http://localhost:3000).

2.  **Development Mode**:
    If you want to edit the frontend code:
    ```bash
    # Terminal 1: Start Backend
    node src/server.js

    # Terminal 2: Start Frontend Dev Server
    cd client
    npm run dev
    ```

## 📱 Mobile Access

You can access the app from other devices on your local network (e.g., your phone).

1.  Ensure your device is on the same Wi-Fi.
2.  Use your computer's **Hostname** or **IP Address**:
    -   **Hostname**: `http://kreato-droid.local:3000` (or `http://kreato-droid:3000`)
    -   **IP Address**: `http://<YOUR_LOCAL_IP>:3000` (e.g., `192.168.1.153:3000`)

## ⚙️ Configuration

-   **Feature Flags**: Click the ⚙️ gear icon in the app header to enable "Advanced Actions" (like Database Reset).

## 📂 Project Structure

```
habit-quest-app/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # React Components (HabitItem, CalendarView, etc.)
│   │   ├── App.jsx         # Main Application Logic
│   │   └── main.jsx        # Entry Point
│   └── tailwind.config.js  # Styling Configuration
├── src/
│   ├── server.js           # Express Server & API
│   └── database.js         # SQLite Database Setup
├── habits.db               # Local Database File
└── package.json            # Root Dependencies
```

## 📄 License

MIT License
