// frontend/src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Your existing pages/components
import LandingPage from "./components/LandingPage";
import HomePage from "./components/HomePage";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

// ✅ Settings page we created
import Settings from "./pages/Settings";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ✅ Make Settings public for now so we can test it easily */}
          <Route path="/settings" element={<Settings />} />

          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Protected Routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
