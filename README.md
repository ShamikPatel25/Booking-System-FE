# Event Booking System - Frontend

A React-based frontend for the Real-Time Event Booking System, built with Vite and Tailwind CSS.

## Tech Stack

- React 19 & React Router 7
- Vite 8
- Tailwind CSS 4
- Axios for API communication

## Features

### User Features
- User registration & authentication
- Browse and discover events
- View event details and show times
- Interactive seat selection with real-time availability
- Booking management and history
- Booking confirmation and success flow

### Admin Panel
- Dashboard overview
- Category management (CRUD)
- Venue & screen management
- Event & show management
- Seat configuration and pricing
- Booking administration

## Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd Booking-System-FE
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your API URL:
   ```
   VITE_API_URL=http://localhost:8000/api
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint


## Related

- Backend API: [Booking-System](../Booking-System)
