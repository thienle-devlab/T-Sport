// AuthContext.js
import { createContext, useContext, useState } from 'react';
import Cookies from 'js-cookie';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Khôi phục thông tin người dùng từ cookie
    const userCookie = Cookies.get('user');
    return userCookie ? JSON.parse(userCookie) : null;
  });

  const login = (userData) => {
    setUser(userData);
    // Lưu thông tin người dùng vào cookie
    Cookies.set('user', JSON.stringify(userData), { expires: 1 });
      // Cập nhật user trong context
    setUser(userData);
  };

  const logout = () => {
    
    Cookies.remove('user');
    Cookies.remove('token');
    Cookies.remove('LoaiNguoiDung');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('LoaiNguoiDung');
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// Hook để sử dụng context
export const useUser = () => useContext(UserContext);
