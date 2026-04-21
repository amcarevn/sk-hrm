import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  // ✅ TẤT CẢ HOOKS Ở TRÊN
  const navigate = useNavigate();
  const { isAuthenticated, loading, login } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ✅ Sau khi hooks đã được gọi đầy đủ → mới return
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    try {
      await login(formData.username, formData.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex items-center justify-center">
          <div className="h-40 w-40 rounded-lg flex items-center justify-center">
            <img src="/bot-logo.png" alt="Logo" className="h-full w-full" />
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <input
              type="text"
              placeholder="Tên đăng nhập"
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-t-md"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mật khẩu"
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-b-md"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-2 px-4 rounded-md text-white bg-primary-600 disabled:opacity-50"
          >
            {isLoggingIn ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
