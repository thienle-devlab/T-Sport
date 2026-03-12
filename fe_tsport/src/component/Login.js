import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaLock, FaSignInAlt, FaUser } from 'react-icons/fa';
import Cookies from 'js-cookie';
import { useUser } from './UserContext';

function Login() {
  const baseURL = process.env.REACT_APP_API_BASE_URL;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { login, logout, user } = useUser();

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   try {
  //     // Gửi yêu cầu đăng nhập
  //     const response = await fetch('http://localhost:3001/login', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         username: username,
  //         password: password,
  //       }),
  //       credentials: 'include',
  //     });
  //     const data = await response.json();
  //     if (!response.ok) {
  //       throw new Error('Failed to login');
  //     }
   
  //     console.log('API Response Data:', data, data.token, data.LoaiNguoiDung, data.TenDangNhap, data.MaNguoiDung);
  //     // Kiểm tra xem API trả về có thông tin người dùng không
  //     if (data && data.LoaiNguoiDung && data.TenDangNhap) {
  //       // Lưu thông tin người dùng và token vào cookie
  //       Cookies.set('user', JSON.stringify({
  //         TenDangNhap: data.TenDangNhap,
  //         LoaiNguoiDung: data.LoaiNguoiDung,
  //         MaNguoiDung: data.MaNguoiDung
  //       }), { expires: 1 }); // Cookie hết hạn sau 1 ngày
  //       Cookies.set('LoaiNguoiDung', data.LoaiNguoiDung, { expires: 1 });
        
  //       console.log('Token saved in cookie:', Cookies.get('token'));
  //       // Lưu token và loại tài khoản vào localStorage
  //       // localStorage.setItem('user', JSON.stringify({
  //       //   TenDangNhap: data.TenDangNhap,
  //       //   LoaiNguoiDung: data.LoaiNguoiDung
  //       // }));
  //       // localStorage.setItem('token', data.token);
  //       // localStorage.setItem('LoaiNguoiDung', data.LoaiNguoiDung);
        
  //       // Chuyển hướng dựa trên loại người dùng
  //       if (data.LoaiNguoiDung === 'KhachHang') {
  //         navigate('/'); // URL của trang chủ bán hàng
  //       } else if (data.LoaiNguoiDung === 'Admin') {
  //         navigate('/admin'); // URL của trang dashboard
  //       } else {
  //         setErrorMessage('Loại tài khoản không hợp lệ');
  //       }
  //     } else {
  //       setErrorMessage('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.');
  //     }
  //   } catch (error) {
  //     console.error('Login error:', error);
  //     setErrorMessage('Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại.');
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Gửi yêu cầu đăng nhập
      const response = await fetch(`${baseURL}/login`, { //http://localhost:3001/login
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to login');
      }
   
      console.log('API Response Data:', {
        token: data.token,
        loaiNguoiDung: data.LoaiNguoiDung,
        tenDangNhap: data.TenDangNhap,
        maNguoiDung: data.MaNguoiDung
      });

      // Kiểm tra xem API trả về có thông tin người dùng không
      if (data && data.LoaiNguoiDung && data.TenDangNhap) {
        const userData = {
          TenDangNhap: data.TenDangNhap,
          LoaiNguoiDung: data.LoaiNguoiDung,
          MaNguoiDung: data.MaNguoiDung
        };

        // Set cookies với đầy đủ options
        const cookieOptions = {
          expires: 1, // 1 ngày
          path: '/',
          sameSite: 'strict',
          secure: window.location.protocol === 'https:'
        };

        // Lưu thông tin người dùng vào cookies
        Cookies.set('user', JSON.stringify(userData), cookieOptions);
        Cookies.set('LoaiNguoiDung', data.LoaiNguoiDung, cookieOptions);
        if (data.token) {
          Cookies.set('token', data.token, cookieOptions);
        }

        // Cập nhật state người dùng (nếu đang sử dụng context)
        login(userData);
        
        // Log để kiểm tra cookies đã được set
        console.log('Cookies sau khi đăng nhập:', {
          user: Cookies.get('user'),
          loaiNguoiDung: Cookies.get('LoaiNguoiDung'),
          token: Cookies.get('token')
        });

        // Chuyển hướng dựa trên loại người dùng
        switch (data.LoaiNguoiDung) {
          case 'KhachHang':
            navigate('/', { replace: true });
            break;
          case 'Admin':
            navigate('/admin', { replace: true });
            break;
          default:
            throw new Error('Loại tài khoản không hợp lệ');
        }

      } else {
        throw new Error('Dữ liệu người dùng không hợp lệ');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(
        error.message || 
        'Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại.'
      );
    }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-8">
          Welcome Back
        </h2>
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded">
            {errorMessage}
          </div>
        )}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
            <FaUser className="absolute top-3 left-3 text-gray-400" />
            <input
              id="username"
              name="username"
              type="text"
              required
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="relative">
            <FaLock className="absolute top-3 left-3 text-gray-400" />
            <input
              id="password"
              name="password"
              type="password"
              required
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 text-sm text-gray-700">
                Remember me
              </label>
            </div>
            <NavLink
              to="/forgotpassword"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot password?
            </NavLink>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
          >
            <FaSignInAlt className="mr-2" />
            Sign in
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <NavLink to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
