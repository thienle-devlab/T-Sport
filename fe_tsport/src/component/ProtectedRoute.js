// ProtectedRoute.js
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useEffect } from 'react';

const ProtectedRoute = ({ children, requiredRole }) => {
  const navigate = useNavigate();
  const userType = Cookies.get('LoaiNguoiDung');

  useEffect(() => {
    if (userType !== requiredRole) {
      navigate('/');
    }
  }, [userType, requiredRole, navigate]);

  if (userType !== requiredRole) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
