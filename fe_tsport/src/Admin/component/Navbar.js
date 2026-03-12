import React, { useState } from 'react';
import { MdNotifications, MdEmail, MdPerson, MdExitToApp, MdSettings, MdKeyboardArrowDown } from 'react-icons/md';
import Cookies from 'js-cookie';
import { useUser } from '../../component/UserContext';
import Logo from '../../img/T-SPORT.png'
import { useNavigate } from 'react-router-dom';

const NavbarAd = ({ sidebarWidth }) => {
  const baseURL = process.env.REACT_APP_API_BASE_URL;
  const [showDropdown, setShowDropdown] = useState(false);
  const userName = JSON.parse(Cookies.get('user') || '{}'); // Lấy thông tin người dùng từ cookie
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { logout } = useUser();
  const handleLogout = async () => {
    try {
        // Gửi yêu cầu POST đến API logout
        await fetch(`${baseURL}/api/logout`, { //http://localhost:3001/api/logout
            method: 'POST',
            credentials: 'include',  // Đảm bảo cookie sẽ được gửi kèm trong yêu cầu
        });
        logout();
        setUser(null);
        // Sau khi logout thành công, chuyển hướng người dùng về trang login
        navigate('/login');
    } catch (error) {
        console.error('Logout failed', error);
    }
};

  return (
    <div 
      className={`fixed top-0 right-0 w-full h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-end px-6 z-20`}
      style={{ left: sidebarWidth }}
    >
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button className="p-2 hover:bg-gray-800 rounded-lg">
            <div className="relative">
              <MdNotifications size={24} className="text-gray-300" />
              <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 text-xs flex items-center justify-center">3</span>
            </div>
          </button>
        </div>

        {/* Messages */}
        <div className="relative">
          <button className="p-2 hover:bg-gray-800 rounded-lg">
            <div className="relative">
              <MdEmail size={24} className="text-gray-300" />
              <span className="absolute -top-1 -right-1 bg-blue-500 rounded-full w-4 h-4 text-xs flex items-center justify-center">5</span>
            </div>
          </button>
        </div>

        {/* User Profile */}
        <div className="relative">
          <button 
            className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-lg"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              {userName?.TenDangNhap?.[0] || 'A'}
            </div>
            <span className="text-gray-300">{userName?.TenDangNhap || 'Admin'}</span>
            <MdKeyboardArrowDown size={20} className="text-gray-300" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-800 py-1">
              {/* <div className="px-4 py-2 border-b border-gray-800">
                <p className="text-sm text-gray-300">Signed in as</p>
                <p className="text-sm font-medium text-white">{user?.Email || 'john@example.com'}</p>
              </div> */}
              
              <button className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 flex items-center gap-2">
                <MdPerson size={20} />
                Hồ sơ
              </button>
              <button className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 flex items-center gap-2">
                <MdSettings size={20} />
                Cài đặt
              </button>
              <div className="border-t border-gray-800">
                <button 
                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                  onClick={handleLogout}
                >
                  <MdExitToApp size={20} />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

};

export default NavbarAd;
