import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaCalendarAlt, FaVenusMars, FaPhone, FaMapMarkerAlt, FaLock, FaRegUserCircle } from 'react-icons/fa';

function Register() {
  const baseURL = process.env.REACT_APP_API_BASE_URL;
  const [formData, setFormData] = useState({
    name: '',
    birthdate: '',
    gender: '',
    phone: '',
    address: '',
    email: '',
    user: '',
    password: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Tạo người dùng
      const userResponse = await fetch(`${baseURL}/data/create/users`, { //http://localhost:3001/data/create/users
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          TenNguoiDung: formData.name,
          Email: formData.email,
          SoDienThoai: formData.phone,
          NgaySinh: formData.birthdate,
          GioiTinh: formData.gender,
          DiaChi: formData.address,
          LoaiNguoiDung: 'KhachHang'
        }),
      });
  
      if (!userResponse.ok) {
        throw new Error('Failed to create user');
      }

      const userData = await userResponse.json();

      // Kiểm tra xem API trả về có mã người dùng không
      // if (!userData.Email) {
      //   throw new Error('User creation failed, no user ID returned');
      // }

      const userId = userData.Email;
      console.log("Created User ID:", userId);
  
      // Tạo tài khoản
      const accountResponse = await fetch(`${baseURL}/data/create/accounts`, { //http://localhost:3001/data/create/accounts
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          TenDangNhap: formData.user,
          MatKhau: formData.password,
          Email: formData.email,
          TrangThai: 'Hoạt động'
        }),
        credentials: 'include',
      });

      if (!accountResponse.ok) {
        throw new Error('Failed to create account');
      }

      // Đăng ký thành công, chuyển hướng đến trang đăng nhập
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      // Xử lý lỗi (ví dụ: hiển thị thông báo lỗi cho người dùng)
    }
  };

  return (
    <div className="min-h-screen py-10 flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-8">
          Create Account
        </h2>
        <form className="space-y-6">
          <div className="relative">
            <FaUser className="absolute top-3 left-3 text-gray-400" />
            <input
              id="name"
              name="name"
              type="text"
              required
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div className="relative">
            <FaCalendarAlt className="absolute top-3 left-3 text-gray-400" />
            <input
              id="birthdate"
              name="birthdate"
              type="date"
              required
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.birthdate}
              onChange={handleChange}
            />
          </div>
          <div className="relative">
            <FaVenusMars className="absolute top-3 left-3 text-gray-400" />
            <select
              id="gender"
              name="gender"
              required
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="">Select Gender</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>
          <div className="relative">
            <FaPhone className="absolute top-3 left-3 text-gray-400" />
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div className="relative">
            <FaMapMarkerAlt className="absolute top-3 left-3 text-gray-400" />
            <input
              id="address"
              name="address"
              type="text"
              required
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          <div className="relative">
            <FaEnvelope className="absolute top-3 left-3 text-gray-400" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="relative">
            <FaRegUserCircle className="absolute top-3 left-3 text-gray-400" />
            <input
              id="user"
              name="user"
              type="text"
              required
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="User"
              value={formData.user}
              onChange={handleChange}
            />
          </div>
          <div className="relative">
            <FaLock className="absolute top-3 left-3 text-gray-400" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
            onClick={handleSubmit}
          >
            Sign up
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <NavLink to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
