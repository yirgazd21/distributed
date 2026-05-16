import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaEnvelope } from 'react-icons/fa';
import { useForgotPasswordMutation } from '../store/slices/usersApiSlice';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await forgotPassword({ email }).unwrap();
      toast.success(res.message || 'Reset request submitted');
      setSubmitted(true);
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-white border border-gray-200 rounded-3xl p-8">
        <Link to="/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-green-600 font-bold mb-6">
          <FaArrowLeft /> Back to Login
        </Link>
        <h1 className="text-3xl font-black mb-2 text-gray-900">Forgot Password</h1>
        <p className="text-gray-500 mb-6">Enter your email and we will send a reset link.</p>
        <form onSubmit={submitHandler} className="space-y-4">
          <label className="block text-sm font-bold text-gray-600">Email</label>
          <div className="relative">
            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-3.5 rounded-xl transition-colors disabled:opacity-70"
          >
            {isLoading ? 'Processing...' : 'Send Reset Link'}
          </button>
        </form>

        {submitted && (
          <div className="mt-6 bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-sm text-green-700 font-bold">Check your email</p>
            <p className="text-xs text-gray-500 mt-2">
              If your account exists, you will receive reset instructions shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
