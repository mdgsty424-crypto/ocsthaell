/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Apps from './pages/Apps';
import AppDetails from './pages/AppDetails';
import Services from './pages/Services';
import ServiceDetails from './pages/ServiceDetails';
import Team from './pages/Team';
import Staff from './pages/Staff';
import Members from './pages/Members';
import UserDashboard from './pages/UserDashboard';
import TeamMemberDetails from './pages/TeamMemberDetails';
import Gallery from './pages/Gallery';
import News from './pages/News';
import NewsDetails from './pages/NewsDetails';
import Contact from './pages/Contact';
import Login from './pages/Login';
import OCChat from './pages/OCChat';
import AdminLogin from './pages/AdminLogin';
import TeamDashboard from './pages/TeamDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AIAssistant from './components/AIAssistant';
import HelpCenter from './pages/HelpCenter';
import ThemeWrapper from './components/ThemeWrapper';
import AnimatedBackground from './components/AnimatedBackground';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import RefundPolicy from './pages/RefundPolicy';
import Careers from './pages/Careers';
import Registration from './pages/Registration';
import RegistrationSuccess from './pages/RegistrationSuccess';
import DashboardRedirect from './pages/DashboardRedirect';
import AdminDashboard from './pages/AdminDashboard';
import ProductUpload from './pages/shop/ProductUpload';
import ShopHome from './pages/shop/ShopHome';
import ProductDetail from './pages/shop/ProductDetail';
import Checkout from './pages/shop/Checkout';
import MyShop from './pages/profile/MyShop';
import Withdraw from './pages/Withdraw';
import Transfer from './pages/Transfer';
import NotFound from './pages/NotFound';
import AutoLogin from './components/AutoLogin';

export default function App() {
  return (
    <ErrorBoundary>
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
                  <Route path="/staff" element={<Staff />} />
                  <Route path="/members" element={<Members />} />
                  <Route path="/all" element={<Members />} />
                  <Route path="/:userKey/profile" element={<UserDashboard />} />
                  <Route path="/team/:id" element={<TeamMemberDetails />} />
                  <Route path="/staff/:id" element={<TeamMemberDetails />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/news" element={<News />} />
                  <Route path="/news/:id" element={<NewsDetails />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/registration" element={<Registration />} />
                  <Route path="/registration-success" element={<RegistrationSuccess />} />
                  <Route path="/dashboard" element={<DashboardRedirect />} />
                  <Route path="/withdraw" element={<ProtectedRoute requireAdmin={false}><Withdraw /></ProtectedRoute>} />
                  <Route path="/transfer" element={<ProtectedRoute requireAdmin={false}><Transfer /></ProtectedRoute>} />
                  <Route path="/oc-id/:ocId/key/:token/autologin/dashboard" element={<AutoLogin />} />
                  <Route path="/chat" element={<ProtectedRoute requireAdmin={false}><OCChat /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/shop" element={<ShopHome />} />
                  <Route path="/shop/product/:id" element={<ProductDetail />} />
                  <Route path="/shop/checkout" element={<Checkout />} />
                  <Route path="/shop/upload" element={<ProtectedRoute requireAdmin={false}><ProductUpload /></ProtectedRoute>} />
                  <Route path="/profile/my-shop" element={<ProtectedRoute requireAdmin={false}><MyShop /></ProtectedRoute>} />
                  <Route path="/help-center" element={<HelpCenter />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/refund-policy" element={<RefundPolicy />} />
                  <Route path="/careers" element={<Careers />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route 
                    path="/admin/dashboard/*" 
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/team/dashboard" 
                    element={
                      <ProtectedRoute requireAdmin={false} requireTeam={true}>
                        <TeamDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
              <AIAssistant />
            </div>
          </Router>
        </ThemeWrapper>
      </AuthProvider>
    </ErrorBoundary>
  );
}
