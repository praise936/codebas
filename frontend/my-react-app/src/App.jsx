// frontend/my-react-app/src/App.jsx - CORRECTED VERSION
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FileText, PlayFill } from 'react-bootstrap-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import InstructorDashboard from './pages/InstructorDashboard';
import SubmissionReview from './pages/SubmissionReview';
import SubmissionsList from './pages/SubmissionsList';
// Add these routes in AppContent:
// Import pages
import Login from './pages/Login';
import Register from './pages/Register';
import IDE from './pages/IDE';
import AssessmentList from './pages/AssessmentList';
import TakeAssessment from './pages/TakeAssessment';
import StudentResults from './pages/StudentResults';

// Dashboard component
const Dashboard = () => {
  const { user, logout } = useAuth();
  const [assessments, setAssessments] = useState([]);

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-8 offset-md-2">
          <div className="card">
            <div className="card-body text-center">
              <h1>Welcome to Code Assessment Platform! 🎉</h1>
              <p className="lead">You are logged in as <strong>{user?.username}</strong> ({user?.user_type})</p>

              <div className="mt-4">
                <h4>Quick Actions</h4>
                <div className="d-flex justify-content-center gap-3 mt-3 flex-wrap">
                  <Link to="/assessments" className="btn btn-primary btn-lg">
                    <PlayFill className="me-2" />
                    Take Assessment
                  </Link>

                  <Link to="/ide" className="btn btn-secondary btn-lg">
                    <PlayFill className="me-2" />
                    Practice Coding
                  </Link>

                  {user?.user_type === 'instructor' && (
                    <Link to="/instructor" className="btn btn-success btn-lg">
                      <FileText className="me-2" />
                      Create Assessment
                    </Link>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <h5>Your Information</h5>
                <table className="table table-bordered">
                  <tbody>
                    <tr>
                      <th>Username</th>
                      <td>{user?.username}</td>
                    </tr>
                    <tr>
                      <th>Email</th>
                      <td>{user?.email}</td>
                    </tr>
                    <tr>
                      <th>Full Name</th>
                      <td>{user?.first_name} {user?.last_name}</td>
                    </tr>
                    <tr>
                      <th>Account Type</th>
                      <td>
                        <span className={`badge ${user?.user_type === 'instructor' ? 'bg-warning' : 'bg-info'}`}>
                          {user?.user_type}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <button onClick={logout} className="btn btn-danger mt-3">Logout</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Home component
const Home = () => {
  const { user } = useAuth();

  return (
    <div className="container mt-5">
      <h1>🚀 Code Assessment Platform</h1>
      <p className="lead">Practice coding, debug programs, and improve your skills</p>

      {user ? (
        <div className="mt-4">
          <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
        </div>
      ) : (
        <div className="mt-4">
          <Link to="/login" className="btn btn-primary me-2">Login</Link>
          <Link to="/register" className="btn btn-success">Register</Link>
        </div>
      )}
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Navbar Component
const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container">
        <Link className="navbar-brand" to="/">🏆 CodeAssess</Link>

        <div className="navbar-nav">
          {user && (
            <>
              <Link className="nav-link" to="/dashboard">Dashboard</Link>
              <Link className="nav-link" to="/ide">Practice IDE</Link>
              <Link className="nav-link" to="/assessments">Assessments</Link>
              {user.user_type === 'instructor' && (
                <Link className="nav-link" to="/instructor">Instructor</Link>
              )}
              {user && user.user_type === 'student' && (
                <Link className="nav-link" to="/my-results">My Results</Link>
              )}
            </>
          )}
        </div>

        <div className="navbar-nav ms-auto">
          {user ? (
            <>
              <span className="nav-item nav-link text-light">
                Welcome, {user.username}!
              </span>
              <button
                onClick={logout}
                className="nav-item btn btn-outline-light btn-sm ms-2"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="nav-link" to="/login">Login</Link>
              <Link className="nav-link" to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

// Main App Component
const AppContent = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/instructor/submission/:id"
          element={
            <ProtectedRoute>
              <SubmissionReview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/submissions/:assessmentId"
          element={
            <ProtectedRoute>
              <SubmissionsList /> {/* We need to create this */}
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor"
          element={
            <ProtectedRoute>
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ide"
          element={
            <ProtectedRoute>
              <IDE />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessments"
          element={
            <ProtectedRoute>
              <AssessmentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-results"
          element={
            <ProtectedRoute>
              <StudentResults />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessment/:id"
          element={
            <ProtectedRoute>
              <TakeAssessment />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

// App Wrapper
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;