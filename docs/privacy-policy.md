---
layout: default
title: Privacy Policy
permalink: /privacy-policy
---

# Privacy Policy

**Folio — Coupon Wallet**
**Last updated:** March 19, 2026

## Introduction

Folio ("we", "our", or "the app") is an open-source mobile application that helps you digitize, organize, and manage coupons. We are committed to protecting your privacy. This Privacy Policy explains what data Folio collects, how it is used, and your rights regarding that data.

## Data We Collect

### Data Stored Locally on Your Device

All data processed by Folio is stored **locally on your device** and is never transmitted to external servers. This includes:

- **Coupon details** — company name, promo code, discount description, expiry date, categories, notes, and other coupon metadata you enter or that is extracted via OCR.
- **Coupon images** — photographs of coupons captured via camera or imported from your photo library, along with generated thumbnails.
- **User preferences** — your nickname, notification settings, sorting preferences, and onboarding status.

### Data We Do NOT Collect

Folio does **not** collect, transmit, or share:

- Personal identification information (name, email, phone number, address)
- Location data
- Analytics or usage tracking data
- Advertising identifiers
- Any data to third-party servers, analytics platforms, or advertisers

## Device Permissions

Folio requests the following device permissions, which are used **only** for the stated purposes:

| Permission | Purpose |
|---|---|
| **Camera** | To photograph physical coupons for scanning via OCR. |
| **Photo Library** | To import coupon images from your device's photo library. |
| **Notifications** | To send local reminders before coupons expire (optional, user-configured). |

You can revoke any of these permissions at any time through your device's system settings. Revoking permissions may limit certain features but will not affect your stored data.

## How Your Data Is Used

- **OCR Processing** — When you scan a coupon, on-device ML Kit OCR extracts text from the image. This processing happens entirely on your device. No image or text data is sent to any server.
- **Local Storage** — All coupon data is stored in a local SQLite database on your device.
- **Notifications** — If enabled, the app schedules local notifications to remind you of upcoming coupon expirations. These notifications are generated and delivered entirely on-device.

## Data Export

Folio allows you to export all your coupon data as a JSON file via the in-app Share sheet. Exported data includes coupon metadata (company name, code, discount, expiry, categories, notes, and status) but **does not** include images. The export is initiated entirely by you and shared only through channels you choose. Folio does not automatically export, upload, or transmit any data.

## Data Retention and Deletion

- Your data persists on your device for as long as you use the app.
- You can delete individual coupons at any time from within the app.
- You can bulk-delete all expired coupons from the Archive screen.
- Uninstalling Folio removes all app data from your device, including the database and all stored images.
- There is no cloud backup or remote storage — once deleted, data cannot be recovered.

## Third-Party Services

Folio does not integrate with any third-party analytics, advertising, crash reporting, or data collection services.

The app uses the following open-source libraries for on-device functionality only:

- **ML Kit OCR** (via `react-native-mlkit-ocr`) — for on-device text recognition. No data is sent to Google or any external service.
- **Expo SDK** — for camera access, image processing, notifications, and file management. All processing is local.

## Children's Privacy

Folio does not knowingly collect information from children under 13. The app does not collect personal information from any user.

## Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be reflected in the "Last updated" date at the top of this page. Continued use of the app after changes constitutes acceptance of the updated policy.

## Contact

If you have questions about this Privacy Policy, please open an issue on our GitHub repository:

[github.com/suryarjuna/folio](https://github.com/suryarjuna/folio)

## Open Source

Folio is open-source software licensed under the MIT License. You can review the complete source code to verify our privacy practices.
