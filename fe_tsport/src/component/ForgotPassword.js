import React from 'react'
import { NavLink } from 'react-router-dom'
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa'

function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Forgot Password
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        <form className="space-y-6">
          <div className="relative">
            <FaEnvelope className="absolute top-3 left-3 text-gray-400" />
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email address"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
          >
            Send Reset Link
          </button>
        </form>

        <div className="mt-6 text-center">
          <NavLink 
            to="/login" 
            className="inline-flex items-center font-medium text-blue-600 hover:text-blue-500"
          >
            <FaArrowLeft className="mr-2" />
            Back to Sign in
          </NavLink>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword