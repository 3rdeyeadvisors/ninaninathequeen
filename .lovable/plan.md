

# Nina Armend - Premium Brazilian Swimwear Platform

## Brand Identity & Design System
- **Elegant gold cursive "Nina Armend" logo** designed in the app
- **Black primary theme** with bronze-gold (#B08D57) accents throughout
- **Luxurious typography** and spacing that reflects premium Brazilian fashion
- **Mobile-first responsive design** optimized for all devices
- Both PWA (installable web app) AND native app capability

---

## Phase 1: Storefront & Shopping Experience

### Homepage
- Full-screen hero with video/image carousel of swimwear collections
- "Shop Now" and "New Arrivals" call-to-action buttons
- Featured collections with smooth fade-in animations
- Customer testimonials carousel with photo reviews
- Instagram-style gallery integration

### Product Browsing
- Category navigation (Bikinis, One-Pieces, Cover-ups, Accessories)
- Product cards with hover animations showing alternate views
- Quick-view modal without leaving the page
- **Personalized recommendations** ("You may also like...")
- Advanced filters (size, color, style, price)

### Mix & Match Builder
- Interactive tool to pair bikini tops with bottoms
- Visual preview of combinations
- Suggested pairings based on style/color coordination
- Easy add-to-cart for complete sets

### Size Guidance
- Interactive size chart with measurement guide
- "Find My Size" quiz based on body measurements
- Size recommendations shown on each product

### Wishlist & Social
- Save favorite items (works for guests, syncs when logged in)
- Share wishlist or products to Instagram, WhatsApp, Facebook
- "Complete the Look" suggestions

### Shopping Cart & Checkout
- Persistent cart with product images
- **Guest checkout** with basic contact info (name, email, address)
- **Login prompt** showing points they'd earn if they create an account
- Stripe payment integration (cards, Apple Pay, Google Pay)
- Order confirmation with tracking info

---

## Phase 2: Customer Accounts & Rewards

### Customer Profile Dashboard
- Order history with tracking links
- Saved addresses and payment methods
- Wishlist management
- **Points balance and rewards tier display**
- **Referral dashboard section**

### Rewards Program
- Earn points on every purchase (e.g., 1 point per $1)
- Bonus points for:
  - Creating an account
  - First purchase
  - Leaving a review
  - Social media shares
  - Birthday bonus
  - **Successful referrals** (bonus when referee makes first purchase)
- Tiered rewards (Bronze → Silver → Gold VIP)
- Redeem points for discounts at checkout

### Referral System (NEW)
**Unique Referral Links**
- Every registered user automatically gets a unique referral code/link
- Shareable links like `ninaarmend.com/ref/SARAH2024`
- One-click copy button and social sharing (WhatsApp, Instagram, Email, SMS)
- QR code generation for in-person sharing

**Referral Rewards**
- Points awarded when a referred friend:
  - Signs up for an account (small bonus)
  - Makes their first purchase (larger bonus)
  - Reaches spending milestones (ongoing rewards)
- Optional: Referred friend also gets a welcome discount (e.g., 10% off first order)

**Referral Tracking Dashboard**
- See total number of people referred
- List of referrals with:
  - Name/username of referred friend
  - Date they joined
  - Status (signed up / made first purchase / VIP customer)
  - Points earned from each referral
- Total lifetime earnings from referrals
- Pending referrals (signed up but haven't purchased yet)
- Share stats (how many times link was clicked vs. conversions)

**Referral Leaderboard (optional gamification)**
- Top referrers get featured or extra bonuses
- Monthly referral challenges with special prizes

---

## Phase 3: Admin Dashboard

### Overview Dashboard
- Daily/weekly/monthly sales metrics with charts
- Real-time order notifications
- Top-selling products
- Customer acquisition stats
- Inventory alerts (low stock warnings)
- **Referral program performance metrics**

### Order Management
- View all orders with status (pending, processing, shipped, delivered)
- Order details with customer info
- Update order status and add tracking numbers
- Refund/cancellation handling

### Product & Image Management
- Easy image swap functionality
- Product enable/disable
- Inventory updates
- Create/edit products (synced with Shopify)

### Analytics Dashboard
- Sales trends over time
- Customer demographics
- Best-selling products and categories
- Conversion funnel analysis
- Revenue by channel
- **Referral analytics**: Top referrers, referral conversion rates, revenue from referrals

### Rewards & Referral Management
- View all referral relationships
- Adjust point values for referral rewards
- See top referrers and their impact
- Manage referral bonuses and promotions

### Nina's AI Assistant
- **Content Writing**: Generate product descriptions, email copy, social captions
- **Business Insights**: "What were my best sellers last month?" "How's my conversion rate?" "Who are my top referrers?"
- **Customer Support**: Draft responses to common questions
- **Marketing Suggestions**: Campaign ideas, promotional strategies, ad copy, referral program optimization

### Marketing & Advertising
- Discount code management
- Email campaign setup
- Social media integration for easy posting
- Facebook/Instagram pixel ready for ads
- **Referral program promotional materials**

---

## Phase 4: Email System

### Transactional Emails (beautifully designed, consistent branding)
- Order confirmation
- Shipping notification with tracking
- Delivery confirmation
- Password reset
- Account welcome email (includes referral link!)
- **Referral success notification** ("Your friend just signed up!")
- **Referral reward earned** ("You earned 500 points from Sarah's purchase!")

### Email Design Standards
- Black background with bronze-gold accents
- Nina Armend logo prominently displayed
- Consistent button styling (rounded corners, proper contrast)
- Mobile-responsive layouts
- Clear typography and proper alignment

---

## Technical Foundation

### Backend (Lovable Cloud + Shopify)
- **Shopify** handles products, inventory, orders, checkout
- **Supabase** for customer profiles, rewards points, **referral tracking**, reviews, admin data
- **Stripe** for payment processing
- **Edge functions** for AI assistant and email sending

### Referral System Database Structure
- Referral codes table (unique per user)
- Referral relationships table (who referred whom)
- Referral events tracking (clicks, signups, purchases)
- Points transactions linked to referrals

### App Deployment
- **PWA**: Installable from browser on any device
- **Native capability**: Ready for App Store & Google Play submission
- Offline-capable for browsing products

---

## Summary

This platform will give Nina a complete e-commerce operation:
- ✅ Stunning branded storefront with interactive features
- ✅ Guest checkout + rewards for logged-in customers
- ✅ **Complete referral system with unique links and tracking**
- ✅ Full admin control with AI-powered assistance
- ✅ Order tracking and analytics
- ✅ Professional email communications
- ✅ Easy advertising and marketing tools
- ✅ App Store ready (PWA + native)

