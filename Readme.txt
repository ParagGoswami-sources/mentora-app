MENTORA 🎓

Empowering Students Through Intelligent Assessment and Personalized Learning

[![React Native](https://img.shields.io/badge/React%20Native-0.79.4-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-53.0.13-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.50.0-green.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-0BSD-blue.svg)](LICENSE)

Mentora is a comprehensive educational assessment and guidance platform that combines psychometric testing, academic evaluations, AI-powered tutoring, and personalized learning roadmaps to help students discover their potential and achieve their academic goals.

🌟 Features

📊 Comprehensive Assessment System
5 Psychometric Tests: Aptitude, Emotional Quotient, Interest, Personality, and Orientation Style assessments
Academic Tests: Stream-specific evaluations (Science, Commerce, Arts) for classes 10-12 and undergraduate students
Real-time Results: Immediate scoring with detailed analytics and insights
Progress Tracking: Complete assessment history and performance trends

🤖 AI-Powered Learning
- Intelligent Tutoring: Context-aware AI responses using Google Gemini API
- Personalized Study Recommendations: Based on individual performance data
- Career Guidance: AI-generated roadmaps and career path suggestions
- Smart Study Tips: Customized advice based on academic level and stream

 📈 Performance Analytics
- Detailed Statistics: Subject-wise analysis and grade calculations
- Visual Charts: Interactive performance graphs and progress indicators
- Trend Analysis: Performance tracking over time
- Strength & Weakness Identification: Data-driven insights for improvement

 🗺️ Learning Roadmap
- Career Path Analysis: Compatibility scoring for different career options
- Skill Gap Identification: Areas requiring focused attention
- Achievement Milestones: Progress checkpoints and goal tracking
- Success Metrics: Measurable objectives and outcomes

 📅 Smart Study Scheduler
- Intelligent Planning: Weak subject prioritization
- Session Management: Optimized study time allocation
- Progress Monitoring: Real-time completion tracking
- Reminder System: Notification-based alerts and study prompts

 👨‍👩‍👧 Parent Dashboard
- Student Overview: Comprehensive performance insights
- Activity Tracking: Study time and progress monitoring
- Progress Reports: Regular performance updates and analytics
- Communication Bridge: Enhanced parent-student-educator interaction

 🎨 Modern User Experience
- Cross-Platform: iOS, Android, and Web compatibility
- Dark Theme: Eye-friendly design with gradient aesthetics
- Intuitive Navigation: Drawer and stack navigation with smooth transitions
- Responsive Design: Adapts to different screen sizes and orientations

 🛠️ Tech Stack

 Frontend
- [React Native](https://reactnative.dev/) - Cross-platform mobile development
- [Expo](https://expo.dev/) - Development and deployment platform
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [React Navigation](https://reactnavigation.org/) - Navigation management
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) - Advanced animations

 Backend & Services
- [Supabase](https://supabase.com/) - Backend-as-a-Service (PostgreSQL, Auth, Real-time)
- [Google Gemini API](https://ai.google.dev/) - AI tutoring and personalized guidance
- [Ollama](https://ollama.ai/) - Local AI fallback service
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) - Local data persistence

 UI/UX
- [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) - Beautiful gradient designs
- [React Native Skia](https://shopify.github.io/react-native-skia/) - High-performance graphics
- [Expo Vector Icons](https://docs.expo.dev/guides/icons/) - Comprehensive icon library

 🚀 Getting Started

 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

 Installation

1. Clone the repository
   bash
   git clone https://github.com/your-username/mentora-app.git
   cd mentora-app
   

2. Install dependencies
   bash
   npm install
   

3. Set up environment variables
   bash
   # Copy the example environment file
   cp .env.example .env
   
   # Add your API keys and configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   

4. Start the development server
   bash
   npm start
   # or
   expo start
   

5. Run on specific platforms
   bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   
   # Web
   npm run web
   

 📱 Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| 📱 Android | ✅ Supported | Android 5.0+ (API level 21+) |
| 🍎 iOS | ✅ Supported | iOS 13.0+ |
| 🌐 Web | ✅ Supported | Modern browsers |

 📦 Project Structure


mentora-app/
├── 📱 src/
│   ├── 🖼️ assets/          # Images, icons, and static resources
│   ├── 🧩 components/      # Reusable UI components
│   ├── 🔗 context/         # Global state management
│   ├── 🧭 navigation/      # Navigation configuration
│   ├── 📄 screens/         # Application screens (13 screens)
│   ├── 🔌 services/        # API integrations and services
│   ├── 📝 types/           # TypeScript type definitions
│   └── 🛠️ utils/           # Utility functions and helpers
├── 🗄️ mentora-backend/    # Express.js backend server
├── 📊 supabase-scripts/   # Database setup and migrations
├── 📋 app.json           # Expo configuration
├── 📦 package.json       # Dependencies and scripts
└── 📖 README.md          # Project documentation


 Key Screens
- Dashboard - Main hub with AI chat and progress overview
- Assessments - Psychometric and academic test interface
- Performance - Detailed analytics and insights
- Roadmap - Career guidance and learning paths
- Scheduler - Study planning and time management
- Profile - User settings and customization
- Parent View - Student progress for parents

 🔧 Configuration

 Supabase Setup
1. Create a new Supabase project
2. Run the database migrations in `supabase-scripts/`
3. Configure Row Level Security (RLS) policies
4. Add your Supabase URL and anon key to `.env`

 AI Services Setup
1. Google Gemini API: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Ollama (Optional): Set up local AI fallback service

 Database Schema
sql
-- Core tables
- students          # User profiles and academic information
- tests            # Assessment definitions and configurations
- questions        # Test question bank with metadata
- exam_results     # Student performance data and analytics
- settings         # Application and user preferences


 🧪 Testing

bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests (when available)
npm test


 📦 Building for Production

 EAS Build (Recommended)
bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Build for both platforms
eas build --platform all


 Classic Build
bash
# Android APK
expo build:android

# iOS IPA
expo build:ios


 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch
   bash
   git checkout -b feature/amazing-feature
   
3. Make your changes
4. Add tests (if applicable)
5. Commit your changes
   bash
   git commit -m 'Add amazing feature'
   
6. Push to the branch
   bash
   git push origin feature/amazing-feature
   
7. Open a Pull Request

 Development Guidelines
- Follow TypeScript best practices
- Use meaningful commit messages
- Add comments for complex logic
- Test on both iOS and Android
- Follow the existing code style

 📈 Roadmap

 Upcoming Features
- [ ] Machine Learning Integration - Predictive analytics
- [ ] Advanced AI Features - Natural language processing
- [ ] Gamification - Achievement badges and rewards
- [ ] Social Features - Student collaboration tools
- [ ] Multi-language Support - Localization features
- [ ] Offline Mode - Enhanced offline capabilities
- [ ] Advanced Analytics - Big data processing
- [ ] Integration APIs - Third-party educational platforms

 📊 Performance

- Bundle Size: Optimized for fast loading
- Cross-Platform: Single codebase for multiple platforms
- Real-time Updates: Instant data synchronization
- Offline Support: Local data caching and sync
- Responsive Design: Adapts to all screen sizes

 🔒 Security

- JWT Authentication - Secure token-based authentication
- Row Level Security (RLS) - Database-level access controls
- Input Validation - Comprehensive data sanitization
- API Key Management - Secure environment variable handling
- Session Management - Automatic token refresh and secure storage

 📄 License

This project is licensed under the 0BSD License - see the [LICENSE](LICENSE) file for details.

 👥 Authors

- Your Name - *Initial work* - [YourGitHub](https://github.com/your-username)

 🙏 Acknowledgments

- React Native Team - For the amazing cross-platform framework
- Expo Team - For simplifying React Native development
- Supabase - For the powerful backend-as-a-service platform
- Google Gemini - For AI-powered educational insights
- Open Source Community - For the incredible tools and libraries

 📞 Support

If you have any questions or need help:

- 📧 Email: your-email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/mentora-app/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/mentora-app/discussions)

 ⭐ Show Your Support

If you found this project helpful, please give it a ⭐ on GitHub!



<div align="center">
  <strong>Built with ❤️ for education and student empowerment</strong>
</div>
