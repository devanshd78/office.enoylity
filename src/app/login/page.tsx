"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lexend } from 'next/font/google';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import Image from 'next/image';

// Load Lexend font if needed
const lexend = Lexend({ subsets: ['latin'], weight: ['400', '700'] });

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('auth')) {
      router.replace('/');
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'password') {
      localStorage.setItem('auth', 'true');
      router.replace('/');
    } else {
      setError('Invalid credentials, please try again.');
    }
  };

  return (
    <div className={`${lexend.className} min-h-screen flex flex-col md:flex-row`}>

      <div className="w-full md:w-1/2 flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 p-6">
        <div className="text-white text-center md:text-left max-w-sm space-y-4">
          <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
            Welcome Back!
          </h2>
          <p className="text-base md:text-lg opacity-90">
            Enter your credentials to access your dashboard and manage your office seamlessly.
          </p>
          <div className="relative w-40 h-40 mx-auto md:mx-0">
            <Image src="/illustrations/office-welcome.svg" alt="Office Illustration" fill />
          </div>
        </div>
      </div>
      {/* Form container */}
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
                  placeholder="Your password"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition"
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