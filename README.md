# Expense Tracker (Full-Stack Edition)

This is a beautiful, feature-rich Expense Tracker web application built using **HTML5**, **Vanilla CSS3**, **JavaScript (ES6)**, **Node.js**, **Express**, and **SQLite**. 

It features an intelligent **Dual-Storage** architecture:
* **Cloud Sync mode**: When the backend server is running, all data (expenses, budgets, profile info, savings goals) is stored securely in a local SQLite database file.
* **Offline fallback mode**: If the backend server is unreachable, the application falls back seamlessly to the browser's `localStorage` and auto-reconnects when the server returns, guaranteeing zero data loss.

---

## 🚀 Getting Started

Follow these steps to set up and run the application on your computer:

### 1. Install Node.js
If you don't have Node.js installed:
* Download and install it from the official website: [nodejs.org](https://nodejs.org/).
* Choose the **LTS (Long Term Support)** version.
* Restart your terminal or command prompt after installation to update your system's path.

### 2. Install Project Dependencies
Open your terminal (PowerShell, Command Prompt, or Bash) in this project's root folder and run:
```bash
npm install
```
This downloads Express, CORS, and the SQLite3 driver.

### 3. Start the Backend Server
Launch the backend API by running:
```bash
npm start
```
The server will start running on [http://localhost:5000](http://localhost:5000) and initialize a persistent database file named `database.sqlite`.

### 4. Run the Web App
Simply open the `index.html` file in your web browser:
* Double-click `index.html` directly to open it.
* *Or* open it using a development server like VS Code's **Live Server** extension.

Once loaded, check the top header: you should see **🟢 Connected** indicating successful database synchronization! If you close the server, it will instantly toggle to **⚪ Offline** and switch to safe local cache backup.

---

## 🛠️ Tech Stack Details

* **Frontend**: Vanilla JS (ES6), HTML5 Canvas (high-DPI scaling charts), CSS variables & keyframe transitions.
* **Backend**: Node.js & Express (RESTful APIs).
* **Database**: SQLite3 (lightweight, zero-setup SQL engine).
