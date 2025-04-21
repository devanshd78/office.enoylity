"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Lexend } from 'next/font/google';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const lexend = Lexend({ subsets: ['latin'], weight: ['400', '700'] });

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    setIsMounted(true);
    const adminId = localStorage.getItem('adminId');
    
    // Prevent redirect loop by checking if already on "/"
    if (adminId && pathname !== '/dashboard') {
      router.replace('/');
    }
  }, [router, pathname]);

  if (!isMounted) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('adminId', data.data.adminId);
        localStorage.setItem('role', data.data.role);
        router.replace('/dashboard');
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again later.');
    }
  };

  return (
    <div className={`${lexend.className} min-h-screen flex flex-col md:flex-row`}>

      {/* Left side welcome panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 p-6">
        <div className="text-white text-center md:text-left max-w-sm space-y-4">
          <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
            Welcome Back!
          </h2>
          <p className="text-base md:text-lg opacity-90">
            Enter your credentials to access your dashboard and manage your office seamlessly.
          </p>
        </div>
      </div>

      {/* Right side form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-100">
        <div className="w-full max-w-sm bg-white shadow-md rounded-lg p-8 space-y-5">
          <h1 className="text-2xl font-bold text-center">Office Panel Login</h1>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Your username"
                autoComplete='username'
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="password"
                  autoComplete='current-password'
                  required
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition duration-200"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
