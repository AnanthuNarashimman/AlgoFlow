import React, { useState } from 'react';
import { Eye, EyeOff, Info, CheckCircle, XCircle } from 'lucide-react';

import {useNavigate} from "react-router-dom";

import LoginBG from "../../assets/LogBG.png";

import "./Login.css";

const Login = () => {

  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate a slight delay for better UX
    setTimeout(() => {
      const validUsername = import.meta.env.VITE_DEMO_USERNAME;
      const validPassword = import.meta.env.VITE_DEMO_PASSWORD;

      if (formData.email === validUsername && formData.password === validPassword) {
        // Store user ID in localStorage for authentication
        localStorage.setItem('algoflow_user_id', formData.email);
        localStorage.setItem('algoflow_login_time', new Date().toISOString());

        showAlert('success', 'Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/learn-space');
        }, 1500);
      } else {
        showAlert('error', 'Invalid credentials. Please check your User ID and password.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="login-container">
      {/* Custom Alert */}
      {alert && (
        <div className={`custom-alert ${alert.type}`}>
          <div className="alert-content">
            {alert.type === 'success' ? (
              <CheckCircle className="alert-icon" size={20} />
            ) : (
              <XCircle className="alert-icon" size={20} />
            )}
            <p className="alert-message">{alert.message}</p>
          </div>
          <div className="alert-progress"></div>
        </div>
      )}

      {/* Left Side: Image Placeholder */}
      <div className="image-section">
        <img
          src={LoginBG}
          alt="Login Visual"
          className="image-placeholder"
          onError={(e) => {
            e.target.style.display = 'none'; // Fallback to gradient if image fails
          }}
        />
        <div className="image-overlay">
          <h2>&lt;/&gt; AlgoFlow</h2>
          <p>Learn algorithms the way your brain works.</p>
          <button className="learn-more-btn" onClick={() => {navigate("/")}}>Learn More</button>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="form-section">
        <div className="form-wrapper">
          <div className="form-header">
            <h1>Login</h1>
            <p>Use the Shared Credentials</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">User ID</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="email"
                  name="email"
                  className="form-input"
                  placeholder="Enter your User ID"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Authenticating...' : 'Login'}
            </button>
          </form>

          <div className="dev-notice">
            <Info className="dev-notice-icon" size={20} />
            <p className="dev-notice-text">
              This is a beta version for evaluation. Use credentials provided in submission materials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;