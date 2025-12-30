import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import LoginBG from "../../assets/LogBG.png";

import "./Login.css";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="login-container">

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
        {/* <div className="image-overlay">
          <h2>Welcome to the Future</h2>
          <p>Experience the next generation of digital workspace. Secure, fast, and beautiful.</p>
        </div> */}
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
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-input"
                  placeholder="Enter your email"
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

            <button type="submit" className="submit-btn">
              Login
            </button>
          </form>

          <div className="dev-notice">
            <p className="dev-notice-text">
              This platform is currently under development. Beta access will be available soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;