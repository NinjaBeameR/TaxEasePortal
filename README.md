# TEP - TaxEasePortal - GST Billing Software

TEP is a modern GST billing and invoicing application designed for Indian small businesses. It provides an admin dashboard, company setup, invoice management, customer and product management, and more, with a focus on usability and compliance.

## Features

- **Admin Panel**: Manage companies and users, view statistics, create/edit/delete users, export data as CSV.
- **Company Setup**: Multi-step guided form for company details, address, contact, and logo upload.
- **Invoice Management**: Create, view, and manage GST-compliant invoices.
- **Customer & Product Management**: Add and manage customers and products.
- **Authentication**: Secure login/logout with Supabase.
- **Responsive UI**: Works seamlessly on desktop and mobile.
- **Export**: Download company/user data as CSV.
- **Netlify Functions**: Serverless backend for user management.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (Postgres, Auth, Storage)
- **Serverless**: Netlify Functions (Node.js)
- **Other**: Lucide Icons, ESLint, PostCSS

## Project Structure

```
project/
  .env.example           # Environment variable template
  netlify/functions/     # Serverless backend functions
  public/                # Static assets
  src/
    App.tsx              # Main app entry
    components/          # React components (Admin, Company, Layout, etc.)
    services/            # Supabase and API logic
    types/               # TypeScript types
    utils/               # Utility functions (validation, helpers)
    supabaseClient.ts    # Supabase client setup
  supabase/              # Database migrations
  index.html             # HTML entry point
  package.json           # NPM scripts and dependencies
  tailwind.config.js     # Tailwind CSS config
  tsconfig.json          # TypeScript config
  vite.config.ts         # Vite config
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- NPM or Yarn
- Supabase account (for backend)
- Netlify account (for serverless functions)

### Setup

1. **Clone the repository**
   ```sh
   git clone <repo-url>
   cd project
   ```

2. **Install dependencies**
   ```sh
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env` and fill in your Supabase and Netlify credentials.

4. **Run the development server**
   ```sh
   npm run dev
   # or
   yarn dev
   ```

5. **Set up Supabase**
   - Create a Supabase project.
   - Run the migrations in `supabase/migrations/` to set up your database schema.
   - Update your `.env` with Supabase keys.

6. **Deploy Netlify Functions**
   - Deploy the `netlify/functions/` directory to Netlify for serverless backend.

### Scripts

- `npm run dev` – Start development server
- `npm run build` – Build for production
- `npm run lint` – Lint code

## Usage

- **Admin Login**: Access `/admin` to manage companies and users.
- **Company Setup**: New users complete a multi-step setup for company details.
- **Invoices**: Create and manage GST invoices from the dashboard.
- **Customers/Products**: Manage your business data easily.

## Environment Variables

See `.env.example` for required variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- (Others as needed for Netlify and deployment)

## License

MIT

---

For more details, see the source code in the [`src/`](src) directory and the [Admin Panel](src/components/Admin/AdminPanel.tsx) and [Company Setup](src/components/Company/CompanySetup.tsx) components.
