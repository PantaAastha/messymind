# Messy Mind

A behavioral diagnostics tool that helps e-commerce businesses identify why shoppers don't convert. Built with Next.js and Supabase.

## What it does

Messy Mind analyzes session data to detect psychological friction patterns in the "Messy Middle" — that chaotic space between awareness and purchase. Upload your **GA4 events** (currently the only supported format), and get a diagnosis with specific interventions to reduce drop-offs.

**Vibe coded** based on behavioral economics research, including Google's Messy Middle framework and principles from "Thinking, Fast and Slow."

## ✨ Features

- **🔍 Pattern Detection**: Identifies 4 behavioral friction patterns:
  - Comparison Paralysis
  - Trust Deficit / Social Proof Gap
  - Value Uncertainty / Price Hesitation
  - Ambient Shopping
  
- **📊 GA4 Event Support**: Upload CSV exports of GA4 events for analysis (view_item, add_to_cart, search, etc.)

- **🎯 Actionable Interventions**: Get specific, prioritized recommendations mapped to detected behavioral drivers

- **💾 Save & Compare**: Save diagnoses to compare changes over time (requires authentication)

- **📄 Export to PDF**: Download detailed diagnostic reports as PDF for sharing and archiving

- **🧠 Research-Backed**: Built on behavioral economics principles, not guesswork

## 🚀 Quick Start

### Prerequisites

- Node.js 20.9+
- Supabase account
- GA4 event data

### Installation

```bash
npm install
```

Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Set up your database:
```bash
# Run supabase/migrations/001_initial_schema.sql in Supabase SQL Editor
npx tsx scripts/seedPatterns.ts
```

Run locally:
```bash
npm run dev
```

## 📥 Data Format

Upload a CSV with GA4 events containing:
- `session_id` - Unique session identifier
- `event_name` - Event type (view_item, add_to_cart, view_cart, begin_checkout, search)
- `event_timestamp` - ISO 8601 timestamp
- `item_id`, `item_name`, `item_category`, `item_price` - Product details
- `page_location` - Page URL
- `search_term` - For search events

## 🛠️ Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Supabase (Auth, Database, RLS)
- Tailwind CSS
- Recharts

## 🗺️ V2 Roadmap

- **Direct API Integration**: Connect to GA4 and Shopify APIs for real-time analysis
- **Pattern Customization**: Create custom patterns for industry-specific friction points
- **Cohort Analysis**: Compare patterns across customer segments and time periods
- **Export & Share**: Generate shareable reports with embeddable insights

## 📝 License

MIT
