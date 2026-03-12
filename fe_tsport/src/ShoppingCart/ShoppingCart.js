import React, { useCallback, useEffect, useState } from 'react';
import { useCart } from '../component/CartContext';
import { NavLink, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const baseURL = process.env.REACT_APP_API_BASE_URL;

// Hàm loại bỏ các mục trùng lặp trong giỏ hàng
const removeDuplicates = (items) => {
  const uniqueItems = [];
  const seenKeys = new Set();

  for (const item of items) {
    const key = `${item.MaSanPham}-${item.MauSac}-${item.KichThuoc}-${item.KieuDang}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueItems.push(item);
    }
  }

  return uniqueItems;
};

const ShoppingCart = () => {
  // const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true)
  const { cartItems=[], updateCart, totalPrice, updateQuantity, removeFromCart, toggleItemSelection } = useCart();
  const user = Cookies.get('user') ? JSON.parse(Cookies.get('user')) : null;
  const navigate = useNavigate();

  const fetchCartItems = useCallback(async () => {
    if (!isLoading) return;
    try {
        const response = await fetch(`${baseURL}/api/cart`, { //http://localhost:3001/api/cart
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        // Tạo mảng itemsWithSelection với giá trị isSelected
        const itemsWithSelection = data.map(item => ({
            ...item,
            isSelected: item.isSelected !== undefined ? item.isSelected : true // Thiết lập giá trị mặc định nếu undefined
        }));

        // Cập nhật giỏ hàng với itemsWithSelection
        updateCart(removeDuplicates(itemsWithSelection)); // Sử dụng itemsWithSelection ở đây
        setIsLoading(false);
    } catch (error) {
        console.error('Error fetching cart items:', error);
        setIsLoading(false);
    }
}, [isLoading, updateCart]);

  useEffect(() => {
    if (user && isLoading) {
      fetchCartItems();
    }
  }, [user, isLoading, fetchCartItems]);

  console.log('Cart Items:', cartItems);

  // Tính toán tổng tiền cho các sản phẩm được chọn
  const subtotal = (cartItems||[]).reduce((sum, item) => 
    item.isSelected ? sum + (Number(item.GiaBan) || 0) * (Number(item.SoLuongSanPham) || 0) : sum, 0
  );
  const shipping = 30000;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;
  
  // Tổng số lượng sản phẩm được chọn
  const totalQuantity = (cartItems||[]).reduce((sum, item) => 
    item.isSelected ? sum + (Number(item.SoLuongSanPham) || 0) : sum, 0
  );

  const handleCheckout = () => {
    if (!user || cartItems.filter(item => item.isSelected).length === 0) {
      // Nếu không có sản phẩm được chọn hoặc không có người dùng, yêu cầu đăng nhập hoặc chọn sản phẩm
      alert('Vui lòng chọn sản phẩm để thanh toán.');
      return;
  }

  const selectedItems = cartItems
  .filter(item => item.isSelected)
  .map(item => item.MaMucGioHang,);

  const IdItems = cartItems
  .filter(item => item.isSelected)
  .map(item => ({
    MaSanPham: item.MaSanPham
  }));

navigate('/checkout', { 
  state: { 
    selectedItems,
    total,
    IdItems,
  } 
});
  };
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Giỏ hàng của bạn</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-2/3 max-h-[calc(100vh-200px)] overflow-y-auto">
        {cartItems.length === 0 ? (
            <div className="text-center text-lg text-gray-500">Không có sản phẩm nào trong giỏ hàng</div>
          ) : 
          (cartItems.map(item => (
            <CartItem key={item.MaMucGioHang} {...item}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            toggleItemSelection={toggleItemSelection}
            />
          )))}
        </div>
        <div className="md:w-1/3">
          <div className="bg-gray-100 p-6 rounded-lg sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Thông tin đơn hàng</h2>
            <div className="flex justify-between mb-2">
              <span>Tổng cộng</span>
              <span>{subtotal.toLocaleString('de-DE')} VND</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Phí vận chuyển</span>
              <span>{shipping.toLocaleString('de-DE')} VND</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>VAT</span>
              <span>{tax.toLocaleString('de-DE')} VND</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Tổng số lượng</span>
              <span>{totalQuantity}</span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-4">
              <span>Tổng hóa đơn</span>
              <span>{total.toLocaleString('de-DE')} VND</span>
            </div>
            <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg mt-4 hover:bg-indigo-700" onClick={handleCheckout}>
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CartItem = ({ MaMucGioHang, MaSanPham, TenSanPham, HinhAnhChinh, GiaBan, SoLuongSanPham, updateQuantity, removeFromCart, MauSac, KichThuoc, KieuDang, isSelected, toggleItemSelection }) => {
  
  return (
    <div className="flex items-center py-4 border-b">
      <NavLink to={`/productdetails/${MaSanPham}`} className="flex-shrink-0">
      <img src={`${HinhAnhChinh}`} alt={TenSanPham} className="w-20 h-20 object-cover mr-4" />
      </NavLink>
      <div className="flex-grow">
        <h3 className="text-lg font-semibold">{TenSanPham}</h3>
        <p className="font-bold">{Number(GiaBan).toLocaleString('de-DE')} VND</p>
        <div className="text-sm text-gray-600">
        <p>Màu sắc: {MauSac}</p>
        <p>Kích thước: {KichThuoc}</p>
        <p>Kiểu dáng: {KieuDang}</p>
        </div>
        <div className="flex items-center mt-2">
        <button 
          onClick={() => updateQuantity(MaMucGioHang, Math.max((parseInt(SoLuongSanPham) || 0) - 1, 1), true)}
          className="px-3 py-1 bg-gray-200 rounded-l border border-gray-300 text-gray-600 hover:bg-gray-300 transition duration-150"
        >
          -
        </button>
        <span className="px-4">{parseInt(SoLuongSanPham) || 0}</span>
        <button 
          onClick={() => updateQuantity(MaMucGioHang, (parseInt(SoLuongSanPham) || 0) + 1, true)}
          className="px-3 py-1 bg-gray-200 rounded-r border border-gray-300 text-gray-600 hover:bg-gray-300 transition duration-150bg-gray-200 text-gray-600 px-2 py-1 rounded-r hover:bg-gray-300"
        >
          +
        </button>
          <button 
            onClick={() => removeFromCart(MaMucGioHang)}
            className="ml-4 text-red-600 hover:text-red-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => toggleItemSelection(MaMucGioHang)}
        className="mr-4"
      />
    </div>
  );
};


export default ShoppingCart;