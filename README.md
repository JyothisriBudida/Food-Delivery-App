# Food Delivery App

A React-based food delivery application connecting food donators, receivers, and volunteers.

## Features

- **Home Page**: Choose your role (Donator, Receiver, or Volunteer)
- **Donator Page**: Donate excess food to those in need
- **Receiver Page**: Request food assistance
- **Volunteer Page**: Help deliver food to receivers
- **Analytics**: Track your impact and activity
- **Profile**: Manage your account settings
- **Footer Navigation**: Easy access to Home, Analytics, and Profile

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

### Running the App

Start the development server:
```bash
npm start
```

The app will open in your browser at `http://localhost:3000`

### Building for Production

Create a production build:
```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   └── Footer.js          # Footer navigation component
├── pages/
│   ├── Home.js           # Home page with role selection
│   ├── Donator.js        # Food donator page
│   ├── Receiver.js       # Food receiver page
│   ├── Volunteer.js      # Volunteer page
│   ├── Analytics.js      # Analytics page
│   └── Profile.js        # Profile page
├── styles/
│   ├── Home.css          # Home page styles
│   ├── RolePage.css      # Role pages styles
│   └── Footer.css        # Footer styles
├── App.js                # Main app component with routing
├── App.css               # Main app styles
├── index.js              # App entry point
└── index.css             # Global styles
```

## Technologies Used

- React 18
- React Router DOM 6
- CSS3

## Future Enhancements

- User authentication
- Real-time food listings
- Delivery tracking
- Push notifications
- Payment integration
- Review and rating system
