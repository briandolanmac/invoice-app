# Invoice App

A small private web app for creating, copying, storing, and exporting tour-guide invoices as PDFs.

## Stack

- Next.js
- Supabase Postgres
- Supabase Auth
- Supabase Storage
- Netlify

## First Setup

1. Add the Netlify environment variables from `.env.example`.
2. Run the SQL in `supabase/schema.sql` in Supabase SQL Editor.
3. Create a private Supabase Storage bucket named `invoice-application`.

The initial storage policy in `supabase/schema.sql` is written for the `invoice-application` bucket name. If the bucket is renamed later, update both the Netlify environment variable and the storage policy.

## Core Idea

Invoices are stored as structured data. PDFs are generated from that saved data and stored as files.
