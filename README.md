# MedScreen Platform

A comprehensive medical screening web application designed for healthcare professionals to create, manage, and conduct digital health screenings for patients.

## 🏥 Overview

MedScreen Platform is a secure, user-friendly web application that enables doctors to:
- Create customizable health screening questionnaires
- Manage patient data and screening history
- Conduct digital screenings with automated scoring
- Generate detailed results with recommendations
- Export comprehensive screening data to CSV

## 🚀 Features

### Core Functionality
- **Dynamic Questionnaire Builder**: Create custom questionnaires with multiple-choice questions and flexible scoring
- **Patient Management**: Add, view, and manage patient profiles with complete screening history
- **Digital Screening Process**: Step-by-step guided screening with progress tracking
- **Automated Scoring**: Real-time score calculation based on predefined criteria
- **Result Analysis**: Detailed results with risk categorization and recommendations
- **Data Export**: Export all screening data to CSV format for analysis
- **Secure Authentication**: JWT-based authentication system with password hashing

### Technical Features
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Clean UI/UX**: Professional medical interface with calming color scheme
- **Real-time Updates**: Instant data synchronization across components
- **Error Handling**: Comprehensive error handling and user feedback
- **Data Validation**: Input validation on both client and server sides

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 with React 18 and TypeScript
- **Styling**: Tailwind CSS for responsive design
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **API**: Next.js API Routes
- **Deployment**: Ready for Vercel/Netlify deployment

## 📋 Prerequisites

- Node.js 18+ and npm
- Modern web browser

## 🚀 Quick Start

1. **Clone and Navigate to Project**:
   ```bash
   cd medscreen-platform
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Database Setup**:
   The database is already initialized with the schema. If you need to reset:
   ```bash
   npx prisma migrate reset
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Access Application**:
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 📖 Usage Guide

### 1. Registration & Login
- New doctors can register with email, password, and name
- Existing doctors can login with credentials
- Secure password hashing with bcrypt

### 2. Dashboard Overview
- View doctor's name and quick stats
- Access patient management and questionnaire templates
- Quick navigation to all features

### 3. Patient Management
- **Add New Patient**: Click "Tambah Pasien Baru" and fill name and age
- **View Patient History**: Click "Lihat Riwayat" to see all screenings
- **Start New Screening**: Click "Mulai Skrining Baru" for any patient

### 4. Questionnaire Builder
- **Create New**: Click "Buat Kuesioner Baru"
- **Add Questions**: Dynamic form for questions and multiple-choice answers
- **Set Scoring**: Each option has configurable score values
- **Define Results**: Create multiple result tiers based on score ranges
- **Save Template**: Store for future use across all patients

### 5. Screening Process
- **Select Template**: Choose from available questionnaires
- **Select Patient**: Pick patient for screening
- **Answer Questions**: Step-by-step guided process
- **View Results**: Automatic calculation and categorization
- **Save Results**: Store in patient history with date/time

### 6. Data Export
- **CSV Export**: Click "Ekspor Semua Data ke CSV" on dashboard
- **Format**: Includes patient name, age, date, questionnaire, score, and result
- **Usage**: Download for external analysis or reporting

## 🗄️ Database Schema

The application uses SQLite with the following models:

- **Doctor**: User authentication and profile data
- **Patient**: Patient information linked to doctor
- **QuestionnaireTemplate**: Custom questionnaires with questions and scoring
- **ScreeningResult**: Individual screening results with answers and scores

## 🔐 Security Features

- **Password Security**: bcrypt hashing with salt rounds
- **JWT Tokens**: Secure session management
- **Input Validation**: Server-side validation for all inputs
- **Authorization**: Doctor-specific data access
- **Data Privacy**: Patient data isolated by doctor

## 🎨 Design System

- **Color Palette**: Professional medical colors (blue, green, gray)
- **Typography**: Clean, readable fonts optimized for medical use
- **Layout**: Responsive grid system for all screen sizes
- **Components**: Reusable UI components with consistent styling
- **Accessibility**: WCAG 2.1 compliant design patterns

## 📱 Mobile Support

The application is fully responsive and works on:
- Desktop computers
- Tablets (iPad, Android tablets)
- Mobile phones (iOS, Android)
- Touch-friendly interface elements

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Patient creation and management
- [ ] Questionnaire creation and editing
- [ ] Screening process flow
- [ ] Result calculation and display
- [ ] CSV export functionality
- [ ] Responsive design on mobile devices

## 🚀 Deployment

### Vercel Deployment
1. Push code to GitHub
2. Import project on Vercel
3. Deploy with default settings
4. Environment variables are pre-configured

### Environment Variables
```env
JWT_SECRET=your-secret-key-change-in-production
```

## 🔧 Development Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npx prisma migrate dev
npx prisma studio

# Linting
npm run lint
```

## 📊 Future Enhancements

- **Mobile App**: React Native or Flutter version
- **Advanced Analytics**: Detailed reporting and charts
- **Multi-language Support**: Indonesian and English
- **Email Notifications**: Screening reminders
- **Integration**: Electronic Health Records (EHR) systems
- **AI Insights**: Machine learning for risk prediction

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

For support or questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints

---

**Built with ❤️ for healthcare professionals**

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
