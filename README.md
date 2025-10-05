# PizzaLab Pizzeria 🍕

A modern, innovative pizza restaurant website built with React, TypeScript, and Supabase.

## Features

- 🍕 **Interactive Menu**: Browse pizzas, specialties, and other items
- 🛒 **Shopping Cart**: Add items to cart with customization options
- 📱 **Responsive Design**: Works perfectly on desktop and mobile
- 🎵 **Background Music**: Atmospheric dining experience
- 📊 **Admin Panel**: Manage products, orders, and content
- 💳 **Stripe Integration**: Secure payment processing
- 🔔 **Real-time Notifications**: Order status updates
- 🌍 **Multi-language Support**: Italian and other languages
- 📍 **Location Services**: Delivery zone validation
- 🎨 **Modern UI**: Beautiful design with animations

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: SatisPay
- **Deployment**: Netlify
- **State Management**: React Context + Hooks

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ahmadiiiiiiii198/pizzalab.git
cd pizzalab
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Start the development server:
```bash
npm run dev
```

## Deployment

### Netlify (Recommended)

This project is configured for automatic Netlify deployment:

1. Connect your GitHub repository to Netlify
2. Netlify will automatically detect the build settings from `netlify.toml`
3. Set your environment variables in Netlify dashboard
4. Deploy!

The `netlify.toml` configuration includes:
- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- SPA redirects for React Router
- Security headers
- Asset caching

### Manual Deployment

```bash
npm run build
# Upload the 'dist' folder to your hosting provider
```

## Database Setup

See the database documentation files:
- `DATABASE_SETUP_GUIDE.md` - Complete setup instructions
- `DATABASE_SETUP_SCRIPT.sql` - Initial database schema
- `DATABASE_POLICIES_AND_FUNCTIONS.sql` - Security policies and functions
- `DATABASE_STORAGE_AND_DATA.sql` - Storage buckets and sample data

## Project Structure

```
pizzalab-pizzeria/
├── src/
│   ├── components/          # React components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom hooks
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript types
├── public/                 # Static assets
├── supabase/              # Database migrations and functions
├── netlify.toml           # Netlify configuration
└── package.json           # Dependencies and scripts
```

## Environment Variables

Required environment variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the development team.
