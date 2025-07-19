# FinOpenPOS

FinOpenPOS is a modern, full-featured Point of Sale (POS) system designed for retail and service businesses. Built with Next.js, TypeScript, and Tailwind CSS, it provides a robust, scalable, and customizable platform for managing sales, inventory, employees, and customer relationships.

## Features

- Multi-language support (English, Spanish, Portuguese)
- Inventory management with low-stock alerts
- Employee and user role management
- Customer management and order history
- Checkout and returns processing
- Cashier and admin dashboards
- Integration with Stripe for payments
- RESTful API endpoints for extensibility
- Responsive UI with modern design

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, Supabase
- **Database:** PostgreSQL (schema provided)
- **Authentication:** Supabase Auth
- **Payments:** Stripe

## Project Structure

- `src/` - Main application source code
- `pages/` - Next.js pages and API routes
- `components/` - Reusable UI and feature components
- `public/` - Static assets
- `messages/` - Localization files
- `schema.sql` - Database schema

## Getting Started

1. **Clone the repository:**
   ```sh
   git clone https://github.com/brittLiban/FinOpenPOS.git
   cd FinOpenPOS
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Set up environment variables:**
   - Copy `.env.example` to `.env.local` and fill in the required values (Supabase, Stripe, etc.)
4. **Set up the database:**
   - Use `schema.sql` to create the database schema in your PostgreSQL instance.
   - (Optional) Seed roles with `seed-roles.sql`.
5. **Run the development server:**
   ```sh
   npm run dev
   ```
6. **Access the app:**
   - Open [http://localhost:3000](http://localhost:3000) in your browser.

## Contributing

Contributions are welcome! Please open issues or pull requests for improvements or bug fixes.

## License

MIT License. See `LICENSE` for details.
