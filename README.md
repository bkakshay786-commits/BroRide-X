# Flash Ride

A beginner-friendly full-stack ride booking web app built with Vanilla HTML/CSS/JavaScript, Node.js, Express, and MongoDB.

## Features

- Home page ride booking form
- Dynamic ride list and status cards
- Profile dashboard with wallet and stats
- Help center with support form
- REST API backend
- MongoDB data storage
- Robotaxi assignment simulation API
- Responsive dark theme UI

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with MongoDB settings (already included).

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`.

## Backend API

- `GET /api/rides`
- `POST /api/rides`
- `GET /api/profile`
- `GET /api/help`
- `POST /api/help/request`
- `POST /api/robot/assign`
- `GET /api/dashboard`
