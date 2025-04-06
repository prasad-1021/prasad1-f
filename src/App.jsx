import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import EventTypesPage from './components/EventTypesPage';
import ProfilePage from './components/ProfilePage';
import Settings from './components/Settings';
import Preferences from './components/Preferences';
import CreateEventPage from './components/CreateEventPage';
import EventBannerPage from './components/EventBannerPage';
import AddEvent from './components/AddEvent';
import AvailabilityPage from './components/Availability/AvailabilityPage';
import BookingPage from './components/Booking/BookingPage';
import Sidebar from './components/Sidebar/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import LandingLayout from './components/LandingLayout';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<LandingLayout />} />
            <Route path="/landing" element={<LandingLayout />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            
            <Route path="/preferences" element={
              <ProtectedRoute>
                <Preferences />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <div className="app">
                  <Sidebar />
                  <main className="main-content">
                    <Navigate to="/events" replace />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/events" element={
              <ProtectedRoute>
                <div className="app">
                  <Sidebar />
                  <main className="main-content">
                    <EventTypesPage />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/availability" element={
              <ProtectedRoute>
                <div className="app">
                  <Sidebar />
                  <main className="main-content">
                    <AvailabilityPage />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/booking" element={
              <ProtectedRoute>
                <div className="app">
                  <Sidebar />
                  <main className="main-content">
                    <BookingPage />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <div className="app">
                  <Sidebar />
                  <main className="main-content">
                    <ProfilePage />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <div className="app">
                  <Sidebar />
                  <main className="main-content">
                    <Settings />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/create-event" element={
              <ProtectedRoute>
                <div className="app">
                  <Sidebar />
                  <main className="main-content">
                    <CreateEventPage />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/event-banner" element={
              <ProtectedRoute>
                <div className="app">
                  <Sidebar />
                  <main className="main-content">
                    <EventBannerPage />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/add-event" element={
              <ProtectedRoute>
                <div className="app">
                  <Sidebar />
                  <main className="main-content">
                    <AddEvent />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <ToastContainer 
            position="top-right"
            autoClose={5000}
            hideProgressBar={true}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
            toastStyle={{
              borderRadius: '4px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 'normal',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
            toastClassName={({ type }) => 
              type === 'error' 
                ? 'toast-error-container' 
                : type === 'success' 
                  ? 'toast-success-container' 
                  : 'toast-container'
            }
            enableMultiContainer={true}
            containerId="default"
          />
          
          <ToastContainer
            position="top-center"
            autoClose={2000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss={false}
            draggable={false}
            pauseOnHover={false}
            theme="colored"
            limit={1}
            closeButton={true}
            style={{
              zIndex: 9999
            }}
            toastClassName="toast-error-container"
            containerId="centered"
          />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App; 