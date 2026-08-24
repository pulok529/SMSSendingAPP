# Pulse Dispatch — Client User Manual & Quick Start Guide

Welcome to **Pulse Dispatch**! This user guide explains how to use your Web Dashboard and Android companion app to import customer contacts, schedule events, write personalized message templates, and broadcast text messages using your mobile SIM card plan.

---

## Table of Contents
1. [How the System Works](#1-how-the-system-works)
2. [Logging In to Your Web Dashboard](#2-logging-in-to-your-web-dashboard)
3. [Step 1: Importing Your Contact List (Excel / CSV)](#3-step-1-importing-your-contact-list-excel--csv)
4. [Step 2: Managing Customer Contacts](#4-step-2-managing-customer-contacts)
5. [Step 3: Scheduling Events & Invitations](#5-step-3-scheduling-events--invitations)
6. [Step 4: Reusable Message Templates & Merge Tags](#6-step-4-reusable-message-templates--merge-tags)
7. [Step 5: Launching SMS Broadcast Campaigns](#7-step-5-launching-sms-broadcast-campaigns)
8. [Step 6: Setting Up Your Android Companion Phone](#8-step-6-setting-up-your-android-companion-phone)
9. [Step 7: Delivery Tracking & Live Audit Logs](#9-step-7-delivery-tracking--live-audit-logs)
10. [Helpful Tips & Frequently Asked Questions (FAQs)](#10-helpful-tips--frequently-asked-questions-faqs)

---

## 1. How the System Works

Pulse Dispatch consists of two simple parts:
- **1. Web Dashboard (Computer):** Used to upload contact spreadsheets, schedule events, write templates, and launch broadcast campaigns.
- **2. Pulse Sender App (Android Phone):** Installed on a phone with an active SIM card. It automatically pulls queued messages from your dashboard and sends them via your cellular carrier.

---

## 2. Logging In to Your Web Dashboard

1. Open your web browser (Chrome, Edge, Safari, Firefox).
2. Enter the web address provided by your administrator.
3. Type your **Email Address** and **Password**.
4. Click **Sign In**.

*Note: Your account is strictly private. Only you can view your customers and campaigns.*

---

## 3. Step 1: Importing Your Contact List (Excel / CSV)

1. Click **Imports** in the left sidebar menu.
2. Prepare an Excel file (`.xlsx`, `.xls`) or `.csv` with columns:
   - `Name` (Customer Name)
   - `Mobile` (Phone Number with country code)
   - `Company` (Optional)
   - `City` (Optional)
   - `Tags` (e.g. VIP, Wholesale, Conference)
3. Drag and drop your file into the upload zone.
4. Set an optional welcome message with `[Name]` tag (e.g. `Hi [Name], welcome to our VIP list!`).
5. Click **Import & Queue Campaign**. Contacts are automatically verified, deduplicated, and added to your private directory.

---

## 4. Step 2: Managing Customer Contacts

1. Click **Customers** in the sidebar.
2. Use the search bar to find contacts by name, mobile, email, or city.
3. Check SMS and Email consent status pills (`SMS ✓`, `Email ✓`).
4. Click **+ Add Customer** to manually add walk-in clients.

---

## 5. Step 3: Scheduling Events & Invitations

1. Click **Events** in the sidebar.
2. Click **+ Create Event**.
3. Fill in:
   - **Event Title:** (e.g. `VIP Flash Sale 2026`)
   - **Date & Time:** Event schedule
   - **Venue / Location:** Venue address
   - **Target Audience:** `VIP Members` or `All Contacts`
   - **SMS Broadcast Message:** `Hi {{name}}, join us for {{event}} at {{venue}} on {{date}}!`
4. Click **Create Event**.
5. Click **Launch Campaign** on the event card when you are ready to send invitations.

---

## 6. Step 4: Reusable Message Templates & Merge Tags

Click **Templates** in the sidebar to design reusable SMS messages.

### Dynamic Merge Tags:
- `{{name}}`: Replaced with recipient full name (e.g. "Hi Sarah")
- `{{company}}`: Replaced with client company name
- `{{event}}`: Replaced with event title
- `{{venue}}`: Replaced with event venue location

*Example:* `Hi {{name}}, show this SMS at our store for an exclusive 20% discount today only!`

---

## 7. Step 5: Launching SMS Broadcast Campaigns

1. Click **Campaigns** in the sidebar.
2. Click **+ Create Campaign**.
3. Choose `SMS (Android SIM)` channel, select optional linked event, and customize your text.
4. Set audience limit (e.g. 50, 200, 500).
5. Click **Launch & Queue SMS**.
6. The SMS jobs will appear in the **Live Android SIM Dispatch Queue**. Your phone will automatically start sending them out!

---

## 8. Step 6: Setting Up Your Android Companion Phone

1. **Install App:** Open `Pulse Sender.apk` on an Android phone (Android 10+) and tap **Install**.
2. **Configure Server:** Tap **🌐 API Gateway Server** on the login screen and enter your server URL.
3. **Log In:** Enter your client email and password and tap **Sign In**.
4. **Grant Permissions:** Tap **Allow** for **Send SMS** and **Notifications**.
5. **Automatic Dispatch:** Once signed in, leave the app open or running in the background. Messages queued from the web will be sent automatically through your phone SIM card.

---

## 9. Step 7: Delivery Tracking & Live Audit Logs

Click **Logs** in the web sidebar to see a live audit table of every message sent:
- **Recipient:** Customer name and phone number
- **Message Content:** Text delivered
- **Status:** `SENT ✓`, `FAILED ✗`, `PENDING ⏳`
- **Timestamp:** Exact time of dispatch

---

## 10. Helpful Tips & Frequently Asked Questions (FAQs)

- **Daily Limits:** Send in batches of 100–300 messages with normal delays to stay within carrier allowances.
- **Background Mode:** Go to phone **Settings → Apps → Pulse Sender → Battery → Unrestricted** so Android keeps dispatching when screen is locked.
- **Forgot Password:** Contact your service administrator for an instant password reset.

---
*Pulse Dispatch — Client Operational User Manual*
