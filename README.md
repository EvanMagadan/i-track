# 📡 I-TRACK: Internet Service Provider Tracking and Billing System

**I-TRACK** is a production-ready, full-stack web platform built to automate client management, tracking, and billing collections for independent Internet Service Providers (ISPs) operating in remote, rural, or off-grid regions.

This system provides a robust, dual-authenticated architectural ecosystem: a private self-service dashboard for clients to securely check network standings and payment histories, paired with an information-dense Master Control dashboard for business operators to oversee billing lifecycles, monitor overdue accounts, and manage automated ledger timelines.

---

## 🛠️ Main Feature Capabilities

### 👤 1. Secure Client Portal
*   **Authenticated Identity Verification:** Secure login flows safeguarding individual consumer data, preventing cross-profile visibility.
*   **Private Billing Dashboard:** Instant visibility into localized parameters including account status badges (`active`, `overdue`), current service tiers (e.g., ₱500 - ₱1000/mo), and exact billing calendar due dates.
*   **Historical Payment Ledger:** A read-only transactional stream inside the profile displaying a clear ledger of past months credited, payments timestamped, and payment channels utilized (e.g., Cash, GCash).

### 👑 2. Master Control Dashboard (Admin Panel)
*   **Operator Control Gateway:** A restricted authentication layer engineered specifically for network administrators to oversee localized operations.
*   **Client CRM Module:** Complete CRUD (Create, Read, Update, Delete) capability to enroll new users, change physical location references, alter data plan assignments, and track active nodes.
*   **Proactive System Alerts:**
    *   *Pre-Due Flags:* Automatic alerts surfaced on the dashboard exactly **1 day prior** to an individual's scheduled billing date.
    *   *Arithmetic Overdue Counter:* Real-time calculation logic measuring distance from scheduled due dates to track precisely how many days an account is late (e.g., `[ 5 Days Past Due ]`).
*   **Interactive Billing Calendar:** A visual 7x5 monthly matrix dynamically positioning data tags representing clients based on their billing rotation cycles.
