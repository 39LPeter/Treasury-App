# 🛡️ Digital Treasurer Pro

**A Multi-Client Financial Management System for Community Groups, Weddings, and Burials.**

## 📖 Overview
Digital Treasurer Pro is a professional web application designed to solve the "Trust Gap" in community contributions. It replaces manual exercise books and Excel sheets with a transparent, digital, and mobile-friendly system. 

It allows a Treasurer to manage multiple clients (e.g., "Maina Wedding", "Church Fund") from a single dashboard while providing a public link for members to search and verify their contributions instantly.

## 🌟 Key Features

### 🏢 For the Treasurer (Admin)
* **Multi-Client Support:** Manage unlimited different groups from one login.
* **WhatsApp Report Generator:** Instantly create professional text lists (bolded totals, emojis) to paste into WhatsApp groups.
* **Smart Entry:** "Flat Rate" buttons and "Firewood" checkboxes to speed up data entry.
* **Data Export:** Download distinct CSV/Excel files for each client for handover.
* **Link Generator:** Create specific links (e.g., `?group=Jane_Wedding`) that send members directly to their specific data.

### 🌍 For the Members (Public)
* **Instant Verification:** Search by name to see if money was received.
* **Transparency:** View total collections and recent activity in real-time.
* **Logistics Tracking:** See if non-cash items (like Firewood) have been recorded.
* **Mobile First:** Designed to look like a native app on phones.

## 🛠️ Tech Stack
* **Frontend:** Streamlit (Python)
* **Database:** SQLite (Embedded, no setup required)
* **Language:** Python 3.9+
* **Data Handling:** Pandas

## 🚀 How to Run Locally

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/your-username/treasurer-app.git](https://github.com/your-username/treasurer-app.git)
    cd treasurer-app
    ```

2.  **Install Requirements**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run the App**
    ```bash
    streamlit run app.py
    ```

4.  **First Time Setup**
    * The app will open in your browser.
    * Go to the sidebar.
    * Under "Admin Login", use the "Create Admin Account" section to set up your first super-user credentials.

## 💼 Business Logic (How to Monetize)
This app is designed as a SaaS (Software as a Service) tool:
1.  **Service Model:** Charge committees a setup fee to manage their records digitally.
2.  **Transparency Model:** Offer the "Public Link" as a premium add-on for groups.
3.  **Handover:** Charge a fee to export the final CSV database at the end of the event.
