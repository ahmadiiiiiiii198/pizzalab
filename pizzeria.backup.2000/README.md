# 🍕 Pizzeria Senza Cipolla - Modern Restaurant Website

A modern, responsive pizzeria website built with React, TypeScript, and Supabase. Features an interactive menu system, admin panel, and optimized for mobile devices.

## 🌟 Features

### 🍽️ Interactive Menu System
- **Category-based Organization**: Products organized by categories (Pizze, Panini, Piadine, etc.)
- **Click-to-Expand**: Click category names to reveal products
- **Real-time Data**: Menu items loaded from Supabase database
- **Responsive Design**: Perfect on desktop, tablet, and mobile

### 🎨 Modern Design
- **Professional Layout**: Clean, modern Italian restaurant aesthetic
- **Mobile-First**: Optimized for all screen sizes
- **Fast Loading**: Optimized performance with code splitting
- **Smooth Animations**: Engaging user experience

### ⚡ Performance Optimized
- **Code Splitting**: Separate bundles for optimal loading
- **Asset Optimization**: Compressed images and assets
- **CDN Ready**: Optimized for global content delivery
- **SEO Friendly**: Meta tags and semantic HTML

### 🔧 Admin Panel
- **Product Management**: Add, edit, delete menu items
- **Category Management**: Organize menu structure
- **Settings Configuration**: Customize website settings
- **Real-time Updates**: Changes reflect immediately

## 🚀 Quick Start

### Prerequisites
- Node.js 20 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ahmadiiiiiiii198/salah-pizzeria-.git
   cd salah-pizzeria-
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_APP_NAME=Pizzeria Senza Cipolla
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**: http://localhost:3000

## 🌐 Deployment

### Netlify Deployment (Recommended)

1. **Connect Repository**:
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "New site from Git"
   - Select this repository

2. **Build Settings**:
   ```
   Build command: npm run build
   Publish directory: dist
   Node version: 20
   ```

3. **Environment Variables**:
   Add these in Netlify dashboard:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   NODE_ENV=production
   VITE_APP_NAME=Pizzeria Senza Cipolla
   ```

4. **Deploy**: Click "Deploy site" and wait for completion

For detailed deployment instructions, see [NETLIFY_DEPLOYMENT_GUIDE.md](./NETLIFY_DEPLOYMENT_GUIDE.md)

## 📁 Project Structure

```
negoziooo/
├── src/
│   ├── components/          # React components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
├── public/                 # Static assets
├── dist/                   # Build output
├── netlify.toml           # Netlify configuration
├── vite.config.ts         # Vite configuration
└── package.json           # Dependencies and scripts
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Check TypeScript types
- `npm run lint` - Run ESLint

## 🎯 Key Pages

- **Homepage** (`/`) - Hero section, featured content
- **Menu** (`/menu`) - Interactive menu with categories
- **Admin Panel** (`/admin`) - Content management system
- **Orders** (`/ordini`) - Order management dashboard

## 🔧 Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Relational database
- **Real-time subscriptions** - Live data updates
- **Row Level Security** - Secure data access

### UI Components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons
- **React Hook Form** - Form management
- **Sonner** - Toast notifications

## 📱 Mobile Experience

- **Responsive Design**: Adapts to all screen sizes
- **Touch-Friendly**: Optimized for mobile interactions
- **Fast Loading**: Optimized for mobile networks
- **PWA Ready**: Can be installed as an app

## 🔒 Security Features

- **HTTPS Enforcement**: Secure connections only
- **Security Headers**: XSS and CSRF protection
- **Content Security Policy**: Prevents code injection
- **Environment Variables**: Secure API key management

## 📊 Performance

- **Lighthouse Score**: 90+ across all metrics
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: Optimized with code splitting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in this repository
- Check the deployment guides in the docs folder
- Review the troubleshooting section in deployment guides

## 🎉 Acknowledgments

- Built with modern web technologies
- Optimized for performance and accessibility
- Designed for Italian restaurant businesses
- Ready for production deployment

---

**Ready to serve delicious pizza online!** 🍕

Visit the live site: [Your Netlify URL here]
