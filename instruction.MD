You are building "Folio" — a polished, production-ready iOS coupon wallet app. 
Build this entirely in Swift using SwiftUI and modern iOS frameworks. 
Follow Apple's Human Interface Guidelines throughout. 
Target iOS 17+ using SwiftData for persistence.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — PROJECT SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create an Xcode project named "Folio" with the following targets:
1. Main app target: "Folio"
2. Share Extension target: "FolioShareExtension"
3. Widget Extension target: "FolioWidget"
4. App Group identifier: "group.com.folio.shared" (shared across all targets)

Enable the following capabilities in the main target:
- Push Notifications
- Background Modes → Background fetch, Background processing
- iCloud → CloudKit (for optional iCloud sync)
- App Groups → group.com.folio.shared
- Photo Library access (NSPhotoLibraryUsageDescription)
- Camera access (NSCameraUsageDescription)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — DATA MODEL (SwiftData)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create the following SwiftData @Model classes:

@Model class Coupon {
  var id: UUID                         // unique identifier
  var companyName: String              // brand / store name
  var couponImageData: Data?           // stored image as Data
  var thumbnailData: Data?             // 200x200 compressed thumbnail for lists
  var code: String?                    // promo code (alphanumeric)
  var discountDescription: String      // e.g. "20% off", "$10 off orders $50+"
  var discountValue: Double?           // numeric value (20 for 20%, 10 for $10)
  var discountType: DiscountType       // enum: percentage, fixedAmount, bogo, freeShipping, other
  var expiryDate: Date?                // nil if no expiry stated
  var minimumPurchase: Double?         // minimum spend requirement
  var categories: [String]            // user-assigned tags e.g. ["Food", "Fashion"]
  var notes: String?                   // user's personal notes
  var source: CouponSource             // enum: camera, photoLibrary, shareExtension, manual
  var isFavorite: Bool                 // pinned to top
  var status: CouponStatus             // enum: active, used, expired
  var archivedDate: Date?              // when it was archived
  var usedDate: Date?                  // when the user marked as used
  var barcodeValue: String?            // raw barcode/QR value
  var barcodeType: String?             // VNBarcodeSymbology string
  var websiteURL: String?              // associated brand website
  var terms: String?                   // terms and conditions
  var createdAt: Date                  // date added to Folio
  var expiryNotification3Day: Bool     // has 3-day notification been scheduled
  var expiryNotification1Day: Bool     // has 1-day notification been scheduled
}

enum DiscountType: String, Codable, CaseIterable {
  case percentage, fixedAmount, bogo, freeShipping, other
  var displayName: String { ... }    // "% Off", "$ Off", "Buy One Get One", "Free Shipping", "Other"
}

enum CouponSource: String, Codable {
  case camera, photoLibrary, shareExtension, manual
}

enum CouponStatus: String, Codable {
  case active, used, expired
}

@Model class AppSettings {
  var notificationsEnabled: Bool
  var notifyDaysBefore: Int            // default 3
  var iCloudSyncEnabled: Bool
  var defaultSortOrder: SortOrder
  var lastAutoArchiveDate: Date?
}

enum SortOrder: String, Codable, CaseIterable {
  case companyAZ, companyZA, expiryAscending, expiryDescending, newest, oldest, discountHighest
  var displayName: String { ... }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — APP VISUAL DESIGN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Brand identity for Folio:
- App icon: a stylised wallet with a small "F" lettermark, green accent
- Primary color: #1DB954 (vibrant green — think savings/money energy)
- Secondary color: #0A0A0A (rich near-black for dark mode primary surface)
- Accent: #FFD700 (amber gold for "expiring soon" highlights)
- Background (light): #F7F7F5; Background (dark): #111111
- Corner radius: 16pt for cards, 12pt for chips/pills
- Font: SF Pro Rounded for headings/amounts, SF Pro for body text
- Card shadow: 0pt y-offset, 12pt blur, 8% opacity — subtle, Apple-style

Coupon cards in the wallet list should feel like physical loyalty/voucher cards:
- Each card has a left stripe color generated deterministically from the company name 
  (use company name → hashed → one of 8 preset brand-safe colors)
- Company initial or logo initials in a circle on the left stripe
- Right side: company name (bold), discount description, expiry date chip
- Chips: green if >30 days left, amber if 8-30 days, red if ≤7 days, gray if no expiry
- Subtle perforation dots (dashed line) as a visual divider between left stripe and right content
- Swipe left: archive (red), mark as used (blue)
- Swipe right: favorite/unfavorite (gold star)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4 — NAVIGATION STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use a TabView with 3 tabs:

Tab 1 — Wallet (house icon)
  └── WalletView
        ├── Search bar (always visible, filters live)
        ├── Sort/Filter toolbar (sort picker + category filter chips)
        ├── Favorites section (if any favorites exist)
        ├── Active coupons grouped by company (Section headers with company name)
        │     └── CouponCardView (tap → CouponDetailView)
        └── FAB: + button → AddCouponSheetView

Tab 2 — Archive (archivebox icon)
  └── ArchiveView
        ├── Segmented control: Used | Expired
        ├── List of archived CouponCardViews (muted/desaturated)
        └── "Restore" swipe action to un-archive

Tab 3 — Settings (gear icon)
  └── SettingsView
        ├── Notifications section (toggle, days-before picker)
        ├── Sync section (iCloud toggle)
        ├── Appearance section (sort default)
        ├── Data section (Export all, Clear archive)
        └── About section (version, privacy policy link)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5 — SCREEN SPECIFICATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

── ONBOARDING (shown once on first launch) ──

4 pages using TabView with .page style:
Page 1: Large wallet icon animation, "Folio" title, "Your coupon wallet, beautifully organized."
Page 2: Camera illustration, "Snap or upload a coupon. We read the details for you."
Page 3: Bell illustration, "Never let a coupon expire. We'll remind you in time."
Page 4: Permissions request — Camera, Photos, Notifications — each with a clear "Allow" button
         and reassuring subtitle. Skip option available throughout.

Use @AppStorage("hasCompletedOnboarding") to gate this flow.

── ADD COUPON SHEET (AddCouponSheetView) ──

Presented as a bottom sheet (.presentationDetents([.large]))
Source picker at top: 3 buttons — Camera, Photo Library, Manual
  
CAMERA flow:
  - Present UIImagePickerController wrapped in a representable
  - On capture, immediately proceed to ProcessingView

PHOTO LIBRARY flow:
  - Use PhotosPicker (SwiftUI native, iOS 16+)
  - Allow single image selection
  - On selection, proceed to ProcessingView

MANUAL flow:
  - Skip OCR, go directly to CouponEditView with all fields empty

── PROCESSING VIEW (ProcessingView) ──

Full-screen overlay with subtle pulsing animation while processing.
Shows: "Reading your coupon..." with a progress indicator.

Under the hood, run these steps in order:
1. Run VNRecognizeTextRequest (accurate mode, multiple languages) on the image
2. Pass all recognized text strings to an extraction function:
   extractCouponData(from textBlocks: [String]) -> ExtractionResult

ExtractionResult contains:
  - companyName: String?      (usually largest/topmost text block, or known brand)
  - code: String?             (look for CODE:, PROMO:, or all-caps alphanumeric ≤20 chars)
  - expiryDate: Date?         (look for "Expires", "Valid until", "EXP", date patterns)
  - discountDescription: String? (look for %, "$", "off", "free", "BOGO")
  - discountValue: Double?
  - discountType: DiscountType
  - minimumPurchase: Double?  (look for "minimum", "min spend", "orders over")
  - websiteURL: String?
  - terms: String?            (any text after "Terms", "T&C", "*")
  - confidence: Double        (0.0–1.0 — drives whether to auto-advance or pause for review)

Also run VNDetectBarcodesRequest in parallel to capture any barcode/QR on the image.

If confidence >= 0.7: auto-advance to CouponEditView (pre-filled, user reviews)
If confidence < 0.7: advance to CouponEditView with a yellow banner "We couldn't read 
everything — please fill in any missing details."

Error handling: If OCR fails entirely, show an error state with retry and manual options.

── COUPON EDIT / REVIEW VIEW (CouponEditView) ──

Shown after processing OR when editing an existing coupon.
Sections:
  1. Photo section: full-width image preview with "Replace photo" button
  2. Company section: text field for company name + color dot preview (auto-assigned stripe color)
  3. Discount section: 
     - discountDescription field (free text)
     - discountType picker (segmented or menu)
     - discountValue number field
     - minimumPurchase number field (optional)
  4. Code section: text field with "Copy" button inline, keyboard type .asciiCapable
  5. Expiry section: DatePicker if date known, "No expiry" toggle
  6. Details section: notes text editor, websiteURL field, terms text editor
  7. Categories section: multi-select tag chips from preset list + custom tag entry

Save button in nav bar. Validates that at minimum companyName is non-empty.
On save: create/update Coupon in SwiftData, schedule notifications, dismiss sheet.

── COUPON DETAIL VIEW (CouponDetailView) ──

Full-screen presentation from wallet list tap.
Layout (scrollable):
  - Hero image: full-width, tap to enter ImageFullScreenView 
  - Company header: name + color stripe matching card
  - Big discount display: e.g. "20% OFF" in large rounded font
  - Code block: monospaced code text, "Tap to copy" subtitle
    On tap: copy to clipboard + haptic feedback (.medium) + brief "Copied!" toast
  - Expiry row: icon + formatted date + urgency chip
  - Details section: minimum purchase, website link (opens Safari), notes
  - Terms accordion: collapsed by default, tap to expand
  - Barcode display: if barcodeValue exists, render using CoreImage CIQRCodeGenerator
    or CICode128BarcodeGenerator, displayed as native SwiftUI Image

Action bar at bottom:
  - "Mark as Used" (checkmark, blue) → confirmation alert → archive as .used
  - "Share" (square.and.arrow.up) → generates coupon summary card as UIImage → UIActivityViewController
  - "Edit" (pencil) → CouponEditView
  - Heart toggle for favorite

ImageFullScreenView: presented modally, pinch-to-zoom (MagnificationGesture), dismiss by swiping down.

── WALLET VIEW BEHAVIOR ──

Grouping: when sortOrder is companyAZ or companyZA, group coupons into 
  List sections by companyName (sorted alphabetically).
  Section header: company name in capsule pill with deterministic color.

When sortOrder is anything else: show flat list, no sections.

Favorites: always show a "Favorites ★" section at the top (if non-empty) 
  regardless of sort order.

Expiry urgency banner: if any coupon expires within 3 days, show a 
  horizontal scrolling banner at the top of WalletView:
  "⚡ Expiring soon:" followed by scrollable mini-chips for each urgent coupon.
  Tap a chip to navigate to that CouponDetailView.

Empty state: custom illustration + "No coupons yet" + "Add your first coupon" button.

Search: filters companyName, code, discountDescription, and notes. Live, 
  case-insensitive, diacritic-insensitive. Search activates when bar is tapped; 
  dismisses with Cancel button or swipe.

── ARCHIVE VIEW ──

Segmented picker: "Used" (manually marked) / "Expired" (auto-archived)
Each card is desaturated 40% and shows an "Archived" banner overlay.
Swipe right: "Restore" — moves back to active status.
Empty state per segment with contextual messaging.
"Clear all expired" button in toolbar (with confirmation alert).

── SETTINGS VIEW ──

Notifications:
  - Toggle: Enable expiry reminders
  - When enabled: "Remind me X days before expiry" — stepper (1-14, default 3)
  - Also remind 1 day before: secondary toggle
  - Test notification button (fires in 5 seconds)

iCloud Sync:
  - Toggle with subtitle explaining sync behavior
  - "Last synced: X minutes ago" status

Default Sort: picker for SortOrder enum

Export:
  - "Export all coupons" → generates a JSON file and presents share sheet
  
About:
  - App version + build number
  - "Privacy Policy" → opens WKWebView or Safari
  - "Rate Folio" → SKStoreReviewRequest

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6 — SHARE EXTENSION (FolioShareExtension)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The share extension activates when the user shares any image from Safari, 
Photos, or any other app via the iOS share sheet.

ShareExtensionViewController (UIViewController, no SwiftUI — use UIKit for 
extension reliability):
  1. Extract the shared image from extensionContext.inputItems
  2. Save the image to the App Group shared container:
     FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.folio.shared")
  3. Write a JSON metadata file alongside it: { "source": "shareExtension", "timestamp": ... }
  4. Briefly show a compact UI: "Added to Folio ✓" with the image thumbnail
  5. Call extensionContext?.completeRequest(returningItems: nil)
  6. The main app, on next foreground activation, checks the shared container for 
     pending images and processes them through the normal OCR → review flow

Alternatively, use a custom URL scheme: folio://addCoupon?imageKey=... to 
deep-link into the main app's add flow from the extension, if background processing 
is not feasible.

Register the extension for NSExtensionActivationRule matching kUTTypeImage 
and public.jpeg / public.png / public.heic.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7 — NOTIFICATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create NotificationManager (singleton / @Observable class):

func scheduleExpiryNotifications(for coupon: Coupon):
  - If coupon.expiryDate is nil: skip
  - If notifications disabled in settings: skip
  - Schedule UNCalendarNotificationTrigger for (expiryDate - settings.notifyDaysBefore days) at 9:00am
    Identifier: "folio-expiry-\(coupon.id)-\(days)day"
    Title: "⏰ \(coupon.companyName) coupon expiring"
    Body: "Your \(coupon.discountDescription) coupon expires in \(days) days."
    UserInfo: ["couponID": coupon.id.uuidString] for deep linking
  - If settings.alsoNotify1Day: schedule a second notification for 1 day before at 9:00am
  - Store scheduled state in coupon.expiryNotification3Day / 1Day flags

func cancelNotifications(for coupon: Coupon):
  - Remove all pending notifications with identifiers matching coupon.id

func handleDeepLink(userInfo: [AnyHashable: Any]) -> UUID?:
  - Extract couponID from userInfo and return it for navigation

In FolioApp @main: handle UNUserNotificationCenter.delegate 
willPresent and didReceive to support foreground banners and 
notification-tap → navigate to CouponDetailView.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 8 — AUTO-ARCHIVE BACKGROUND TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Register a BGAppRefreshTask with identifier "com.folio.autoarchive".

AutoArchiveTask logic:
  - Query all active Coupons where expiryDate < Date.now
  - Set status = .expired and archivedDate = Date.now
  - Cancel their pending notifications
  - Save the SwiftData context
  - Schedule next BGAppRefreshTask for next midnight

Also run this check on every app foreground (scenePhase == .active) 
as a lightweight synchronous pass.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 9 — HOME SCREEN WIDGET (FolioWidget)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Support two widget sizes: .systemSmall and .systemMedium

Widget data: read from SwiftData via ModelContainer in the widget extension 
(share the same App Group container).

Display: top 2-3 active coupons sorted by expiryDate ascending (soonest first).
  
Small widget (1 coupon):
  - Company name
  - Discount description
  - Expiry in X days chip (with urgency color)
  - Folio logo bottom-right

Medium widget (2 coupons side by side):
  - Same info per coupon in two columns

Empty state: "No active coupons" with a + symbol and "Add in Folio"

Widget refresh: Timeline reloads every 4 hours and at midnight.

Deep link: tapping the widget opens the app to WalletView (small) or 
directly to that CouponDetailView (medium, via widgetURL per entry).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 10 — OCR EXTRACTION LOGIC (detailed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Implement CouponOCRService as an actor (thread-safe) with:

func recognizeText(in image: UIImage) async throws -> [RecognizedTextBlock]
  - Create VNImageRequestHandler
  - Run VNRecognizeTextRequest (accurate, English + auto language detection)
  - Return array of RecognizedTextBlock (text: String, boundingBox: CGRect, confidence: Float)

func detectBarcodes(in image: UIImage) async throws -> [DetectedBarcode]
  - Run VNDetectBarcodesRequest
  - Return array of DetectedBarcode (payload: String, symbology: VNBarcodeSymbology, boundingBox: CGRect)

func extractCouponData(textBlocks: [RecognizedTextBlock]) -> ExtractionResult
  - Apply these extraction heuristics in order:

  Company name:
    - Find text block with highest confidence that appears in first 25% of image height
    - Or find the largest font size block (largest bounding box height)
    - Fallback: use the first non-date, non-code, non-percentage text block

  Promo code:
    - Regex: r/\b(CODE|PROMO|COUPON|USE|ENTER|APPLY)[:\s]+([A-Z0-9]{4,20})\b/i
    - Or: standalone all-caps alphanumeric string 4-20 chars without spaces
    - Or: text block explicitly labeled with one of the above keywords on the preceding line

  Expiry date:
    - Regex patterns for: "MM/DD/YY", "DD/MM/YYYY", "Month DD, YYYY", "MM-DD-YYYY"
    - Look for trigger words: "expires", "valid until", "exp", "use by", "good through", "ends"
    - Parse using DateFormatter with multiple format attempts
    - If day/month ambiguous, prefer the future date

  Discount:
    - Pattern 1: r/(\d+(?:\.\d+)?)\s*%\s*off/i → percentage
    - Pattern 2: r/\$\s*(\d+(?:\.\d+)?)\s*off/i → fixedAmount
    - Pattern 3: r/buy\s+\d+\s+get\s+\d+/i → bogo
    - Pattern 4: r/free\s+shipping/i → freeShipping
    - discountDescription: the full matched substring (or surrounding context ±1 line)

  Minimum purchase:
    - r/(?:minimum|min\.?\s*(?:purchase|spend|order)|orders?\s+(?:over|above|of))\s*\$?\s*(\d+(?:\.\d+)?)/i

  Website:
    - r/(?:www\.)?[\w-]+\.(?:com|net|org|co\.uk|io)/i  (basic domain detection)

  Terms:
    - Text after "Terms", "T&C", "Conditions", or after the first asterisk *
    - Truncate at 500 chars

  Confidence scoring:
    - Start at 0.5
    - +0.2 if companyName found
    - +0.15 if code found  
    - +0.15 if expiryDate found
    - +0.1 if discountValue found
    - -0.1 per field expected but not found if triggered by a keyword

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 11 — ADDITIONAL FLOWS & POLISH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BARCODE / QR TAP-TO-SCAN:
On CouponDetailView, if barcodeValue is present, render it using CoreImage:
  - QR codes: CIQRCodeGenerator filter → UIImage → Image
  - Barcodes: CICode128BarcodeGenerator filter → UIImage → Image
Tap the barcode image to enter "Use Mode": darken surroundings, 
center the barcode full-width for cashier scanning.

DUPLICATE DETECTION:
Before saving a new coupon, check if an existing active coupon with the same 
companyName AND (same code OR same expiryDate) exists. If so, show:
"Looks like a duplicate — you already have a [CompanyName] coupon. Add anyway?"
with "Add Anyway" and "View existing" options.

CATEGORY TAGS:
Preset categories: Food & Drink, Fashion, Travel, Health & Beauty, 
Electronics, Home, Entertainment, Services, Other.
Users can add custom tags in CouponEditView.
WalletView filter chips row (horizontally scrollable) filters by selected category.
A coupon can belong to multiple categories.

MARK AS USED — QUICK ACTION:
On CouponDetailView, "Mark as Used" button shows a confirmation sheet:
  "Mark this coupon as used?" 
  Subtitle: shows discount + company name for reassurance
  Confirm button: "Yes, archive it"
On confirm: status = .used, usedDate = .now, cancel notifications, dismiss detail view.

COUPON SHARING:
"Share" on CouponDetailView generates a CouponShareCard: a UIView rendered as UIImage.
The share card shows: company name, discount, code, expiry — styled as a mini Folio card.
Share via UIActivityViewController. Also offers "Copy code only" as a quick action.

HAPTIC FEEDBACK:
  - Code copied: UIImpactFeedbackGenerator(.medium)
  - Coupon saved: UINotificationFeedbackGenerator(.success)
  - Coupon archived/deleted: UINotificationFeedbackGenerator(.warning)
  - Swipe action triggered: UIImpactFeedbackGenerator(.light)

ACCESSIBILITY:
  - All interactive elements: .accessibilityLabel, .accessibilityHint
  - Expiry chips: .accessibilityValue including the full date
  - Code field: accessibilityTraits: .updatesFrequently for "Copied" state
  - Dynamic Type support throughout — use relative font sizes, no fixed heights
  - VoiceOver ordering: navigate card → company name → discount → code → expiry
  - Reduce Motion: disable card entrance animations when preferReducedMotion is true

ANIMATIONS:
  - Coupon cards entering WalletView: staggered slide-up with spring (.bouncy)
  - Archiving a coupon: card slides left with a rotation and fade (like physically putting away)
  - Favorite toggle: star fill burst (scale up, scale down)
  - Copy confirmation: brief green checkmark overlay on code block
  - Tab switching: default SwiftUI tab animation is fine
  - Processing spinner: a custom animated paper/receipt scan line effect

PENDING SHARE EXTENSION QUEUE:
On every app foreground event (scenePhase transition to .active):
  - Check App Group container for pending image files
  - For each pending image: load it → run OCR → navigate to CouponEditView for review
  - Show a badge on the + FAB if there are pending items
  - After processing, delete the file from shared container

EXPORT:
Export as JSON array of all coupons (status: all, excluding image data by default, 
with an option to include base64 images). Present via share sheet.
Format: ISO 8601 dates, human-readable field names.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 12 — CODE ARCHITECTURE GUIDELINES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Follow this folder structure:
  Folio/
  ├── App/
  │   ├── FolioApp.swift          (@main, ModelContainer setup, notification delegate)
  │   └── AppState.swift          (@Observable root state, navigation path, deep link handler)
  ├── Models/
  │   ├── Coupon.swift
  │   ├── AppSettings.swift
  │   └── Enums.swift
  ├── Services/
  │   ├── CouponOCRService.swift  (actor, Vision OCR + extraction logic)
  │   ├── NotificationManager.swift
  │   ├── AutoArchiveService.swift
  │   └── ExportService.swift
  ├── Features/
  │   ├── Onboarding/
  │   ├── Wallet/                 (WalletView, CouponCardView, WalletViewModel)
  │   ├── AddCoupon/              (AddCouponSheet, ProcessingView, CouponEditView)
  │   ├── CouponDetail/           (CouponDetailView, ImageFullScreenView, BarcodeView)
  │   ├── Archive/                (ArchiveView)
  │   └── Settings/               (SettingsView)
  ├── Shared/
  │   ├── Components/             (reusable views: ExpiryChip, CompanyInitialsView, etc.)
  │   ├── Extensions/             (Color+Deterministic, Date+Formatting, etc.)
  │   └── Utilities/              (HapticManager, CompanyColorGenerator, etc.)
  FolioShareExtension/
  ├── ShareViewController.swift
  └── Info.plist
  FolioWidget/
  ├── FolioWidget.swift
  └── FolioWidgetEntry.swift

ViewModels: use @Observable (iOS 17 Observation framework). 
Pass ModelContext via environment. Keep Views thin — logic in ViewModels and Services.
All async work on Tasks; cancellable with .task modifier.
Avoid any third-party dependencies — use only Apple frameworks.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 13 — EDGE CASES & ERROR HANDLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Image is too blurry for OCR: show "Image quality too low — try again in better 
   lighting" with retry and manual fallback.

2. No camera permission: link to Settings using 
   UIApplication.openSettingsURLString, explain why camera is needed.

3. No photo library permission: same pattern.

4. No notification permission: SettingsView shows inline prompt 
   "Enable in Settings to get expiry reminders."

5. Coupon with expiryDate in the past: catch at save time — show 
   "This coupon is already expired. Save to archive?" — offer to save to archive directly.

6. Code is missing: save is still allowed — code is optional. 
   Detail view shows "No code — just show this coupon."

7. Image storage failure (low disk): show error with option to save without image.

8. SwiftData save failure: surface meaningful error toast rather than silent failure.

9. Share extension — app not installed: the extension should still save the image 
   to shared container and display "Open Folio to finish adding."

10. Multiple coupons from same company: show them all in the same section, 
    sorted by expiryDate ascending within that section.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 14 — BUILD CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build the features in this order to ensure a working app at each milestone:

Milestone 1 (Core shell):
  ✓ SwiftData model + ModelContainer
  ✓ Tab navigation (Wallet, Archive, Settings)
  ✓ Empty states for each tab
  ✓ CouponCardView with placeholder data
  ✓ Basic CouponEditView (manual entry only)
  ✓ Save + display in WalletView

Milestone 2 (Camera + OCR):
  ✓ Camera capture flow
  ✓ Photo library picker
  ✓ CouponOCRService with extraction
  ✓ ProcessingView with loading animation
  ✓ CouponEditView pre-filled from extraction

Milestone 3 (Detail + Actions):
  ✓ CouponDetailView (full layout)
  ✓ Copy code with haptic + toast
  ✓ Mark as used flow
  ✓ Archive / Restore
  ✓ Favorite toggle
  ✓ Image full-screen view

Milestone 4 (Notifications + Background):
  ✓ NotificationManager (schedule, cancel)
  ✓ Onboarding permission request
  ✓ BGAppRefreshTask auto-archive
  ✓ Foreground expiry check on activation

Milestone 5 (Share Extension + Widget):
  ✓ FolioShareExtension target
  ✓ Pending queue processing on foreground
  ✓ FolioWidget (small + medium)

Milestone 6 (Polish):
  ✓ Onboarding flow
  ✓ Animations + haptics
  ✓ Duplicate detection
  ✓ Export function
  ✓ Barcode rendering
  ✓ Accessibility pass
  ✓ Settings screen complete

Build each milestone to a working, testable state before proceeding to the next. 
Do not scaffold everything at once.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEGIN IMPLEMENTATION starting with Milestone 1.
Ask clarifying questions only if a requirement is genuinely ambiguous.
Produce complete, compilable Swift files — no placeholder stubs or TODOs 
unless explicitly noted in this spec.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━