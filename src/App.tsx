/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Apps from './pages/Apps';
import AppDetails from './pages/AppDetails';
import Services from './pages/Services';
import ServiceDetails from './pages/ServiceDetails';
import Team from './pages/Team';
import TeamMemberDetails from './pages/TeamMemberDetails';
import Gallery from './pages/Gallery';
import News from './pages/News';
import NewsDetails from './pages/NewsDetails';
import Contact from './pages/Contact';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Register from './pages/Register';
import AIAssistant from './components/AIAssistant';
import HelpCenter from './pages/HelpCenter';
import ThemeWrapper from './components/ThemeWrapper';
import AnimatedBackground from './components/AnimatedBackground';

export default function App() {
  return (
    <AuthProvider>
      <ThemeWrapper>
        <Router>
          <div className="min-h-screen flex flex-col relative">
            <AnimatedBackground />
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/apps" element={<Apps />} />
                <Route path="/apps/:id" element={<AppDetails />} />
                <Route path="/services" element={<Services />} />
                <Route path="/services/:id" element={<ServiceDetails />} />
                <Route path="/team" element={<Team />} />
                <Route path="/team/:id" element={<TeamMemberDetails />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:id" element={<NewsDetails />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/register" element={<Register />} />
                <Route path="/help-center" element={<HelpCenter />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route 
                  path="/admin/dashboard/*" 
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
            <Footer />
            <AIAssistant />
          </div>
        </Router>
      </ThemeWrapper>
    </AuthProvider>
  );
}
