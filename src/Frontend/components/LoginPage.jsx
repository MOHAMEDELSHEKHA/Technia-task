import React, { useState } from 'react';
import { User, Lock, CheckCircle, Eye } from 'lucide-react';

const LoginPage = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSplash, setShowSplash] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [splashStep, setSplashStep] = useState(0);

  const handleLogin = async () => {
    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        })
      });

      if (!response.ok) {
        throw new Error('Invalid username or password');
      }

      const userData = await response.json();
      
      const token = btoa(`${credentials.username}:${credentials.password}`);
      localStorage.setItem('auth_token', token);
      
      setUserInfo(userData);
      setShowSplash(true);
      
      setTimeout(() => setSplashStep(1), 800);  
      setTimeout(() => setSplashStep(2), 1500); 
      setTimeout(() => {
        //  redirect to dashboard
        onLoginSuccess(userData);
      }, 2500);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const testLogin = (username, password) => {
    setCredentials({ username, password });
    setTimeout(() => handleLogin(), 100);
  };

  const SplashScreen = () => (
    <div className={`fixed inset-0 bg-white flex items-center justify-center z-50 transition-opacity duration-500 ${
      splashStep === 2 ? 'opacity-0' : 'opacity-100'
    }`}>
      <div className="text-center">
        <div className="mb-8">
          <img 
            src="/assets/technia-logo.png" 
            alt="Technia Logo" 
            className="h-16 w-auto mx-auto mb-4"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <h1 className="text-gray-800 text-2xl font-bold">Technia ERP</h1>
        </div>
        
        <div className="relative flex flex-col items-center justify-center space-y-4">
          <CheckCircle className={`h-12 w-12 text-green-500 transition-all duration-700 ${
            splashStep >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
          } ${
            splashStep >= 2 ? 'transform translate-y-8' : ''
          }`} />
          
          <span className={`text-gray-800 text-xl font-medium transition-all duration-500 ${
            splashStep >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            Welcome, {userInfo?.first_name} {userInfo?.last_name}
          </span>
        </div>
        
        <div className="mt-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
          <p className="text-gray-600 text-sm mt-2">Loading your dashboard...</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {showSplash && <SplashScreen />}

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row">
          <div className="md:hidden flex justify-center items-center py-8 bg-white">
            <img 
              src="/assets/technia-logo.png" 
              alt="Technia Logo" 
              className="h-16 w-auto"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'block';
              }}
            />
            <div className="hidden text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-white">T</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/2 p-8 flex flex-col justify-between min-h-96">
            <div>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h1>
                <p className="text-gray-600 text-sm">Welcome to Technia ERP System</p>
              </div>

              <div className="space-y-8">
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      name="username"
                      type="text"
                      value={credentials.username}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      className="block w-full pl-10 pr-3 py-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      placeholder="Username"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      name="password"
                      type="password"
                      value={credentials.password}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      className="block w-full pl-10 pr-3 py-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      placeholder="Password"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-20">
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </div>

          <div className="hidden md:flex w-1/2 bg-white relative items-center justify-center">
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-50"></div>
            </div>
            
            <div className="relative z-10 bg-white bg-opacity-20 rounded-3xl p-8 backdrop-blur-sm">
              <img 
                src="/assets/technia-logo.png" 
                alt="Technia ERP" 
                className="w-64 h-64 object-contain mx-auto"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              <div className="hidden w-64 h-64 bg-white bg-opacity-30 rounded-2xl flex items-center justify-center">
                <div className="text-center text-gray-700">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">T</span>
                  </div>
                  <h2 className="text-xl font-bold">Technia ERP</h2>
                  <p className="text-sm opacity-90">Enterprise Solution</p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-1/3 left-1/4 w-6 h-6 bg-gray-200 rounded-full"></div>
            <div className="absolute top-1/3 left-1/3 w-4 h-4 bg-gray-100 rounded-full"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;