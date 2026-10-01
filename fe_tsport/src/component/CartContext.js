import { createContext, useCallback, useContext, useEffect, useState } from "react";


const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [totalPrice, setTotalPrice] = useState(0);
  const baseURL = process.env.REACT_APP_API_BASE_URL;

  const addToCart = async (
    // product,
    price,
    quantity,
    MaMau,
    // selectedColor,
    // selectedSize,
    // selectedStyle
) => {
    try {
        const response = await fetch(`${baseURL}/api/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                MaMau: MaMau,
                SoLuongSanPham: quantity,
                TongGiaSanPham: price * quantity
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || 'Không thể thêm sản phẩm vào giỏ hàng'
            );
        }

        // Backend đã cập nhật DB thành công
        // Lấy lại dữ liệu chính xác từ DB
        const cartResponse = await fetch(`${baseURL}/api/cart`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!cartResponse.ok) {
            throw new Error('Không thể lấy lại giỏ hàng');
        }

        const cartData = await cartResponse.json();

        setCartItems(cartData);

    } catch (error) {
        console.error('Error adding to cart:', error);
    }
};


  const updateCart = useCallback((newItems) => {
    setCartItems(newItems);
  }, []);

  // const updateDatabase = useCallback(async (updatedItems) => {
  //   try {
  //     const itemsToSend = updatedItems.map(({ markedForAction, ...item }) => item);
  //     const response = await fetch(`${baseURL}/api/cart/update`, { //http://localhost:3001/api/cart/update
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       credentials: 'include',
  //       body: JSON.stringify(itemsToSend),
  //     });
  //     if (!response.ok) {
  //       throw new Error('Failed to update cart in database');
  //     }
  //     // Nếu server trả về dữ liệu mới, bạn có thể cập nhật state ở đây
  //     const data = await response.json();
  //     return data.cartItems;
  //   } catch (error) {
  //     console.error('Error updating cart:', error);
  //     throw error;
  //   }
  // }, []);

  const toggleItemSelection = useCallback(async (MaMucGioHang) => {
    console.log('Toggling item selection:', MaMucGioHang);
    try {
      const itemToUpdate = cartItems.find(item => item.MaMucGioHang === MaMucGioHang);
      if (!itemToUpdate) {
        console.error('Item not found in cart');
        return;
      }
  
      const newIsSelected = !itemToUpdate.isSelected;
  
      const response = await fetch(`${baseURL}/api/cart/update-quantity`, { //http://localhost:3001/api/cart/update-quantity
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          MaMucGioHang,
          SoLuongSanPham: itemToUpdate.SoLuongSanPham,
          isSelected: newIsSelected
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to update cart in database');
      }
  
      const data = await response.json();
  
      const updatedItems = cartItems.map(item =>
        item.MaMucGioHang === MaMucGioHang ? { ...item, isSelected: newIsSelected } : item
      );
  
      setCartItems(updatedItems);
      setTotalPrice(data.newTotalCartValue);
  
      console.log('Item selection toggled successfully');
    } catch (error) {
      console.error('Error toggling item selection:', error);
      // Có thể thêm xử lý lỗi ở đây, ví dụ: hiển thị thông báo cho người dùng
    }
  }, [cartItems, baseURL]);

    // Cập nhật sản phẩm trong giỏ hàng
    const updateQuantity = useCallback(async (MaMucGioHang, newQuantity, isSelected) => {
      if (!MaMucGioHang || newQuantity === null || newQuantity === undefined || newQuantity < 0) {
          console.error('Invalid data for updating quantity');
          return;
      }
  
      try {
          const response = await fetch(`${baseURL}/api/cart/update-quantity`, { //http://localhost:3001/api/cart/update-quantity
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ MaMucGioHang, SoLuongSanPham: newQuantity, isSelected }), // Thêm isSelected vào body
          });
  
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Failed to update quantity');
          }
  
          const { updatedItem, newTotalCartValue } = await response.json();
  
          setCartItems(prevItems => prevItems.map(item => 
              item.MaMucGioHang === MaMucGioHang ? { ...item, ...updatedItem } : item
          ));
  
          setTotalPrice(newTotalCartValue);
  
      } catch (error) {
          console.error('Error updating quantity:', error);
          // Hiển thị thông báo lỗi cho người dùng
      }
  }, [baseURL]);

// Xóa sản phẩm trong giỏ hàng
const removeFromCart = useCallback(async (MaMucGioHang) => {
  try {
    const response = await fetch(`${baseURL}/api/cart/remove-item`, { //'http://localhost:3001/api/cart/remove-item
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ MaMucGioHang }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to remove item');
    }

    const { newTotalCartValue } = await response.json();

    setCartItems(prevItems => prevItems.filter(item => item.MaMucGioHang !== MaMucGioHang));
    setTotalPrice(newTotalCartValue);

  } catch (error) {
    console.error('Error removing item:', error);
    // Hiển thị thông báo lỗi cho người dùng
  }
}, [baseURL]);

const removeItemsFromCart = useCallback((itemsToRemove) => {
  setCartItems(prevItems => 
    prevItems.filter(item => !itemsToRemove.includes(item.MaMucGioHang))
  );
}, []);

  // Hàm lấy tổng giá trị giỏ hàng
  const getTotalPrice = useCallback(() => {
    const total = cartItems.reduce((sum, item) => 
      sum + (Number(item.GiaBan) * Number(item.SoLuongSanPham)), 0
    );
    setTotalPrice(total);
  }, [cartItems]);

  useEffect(() => {
    getTotalPrice();
  }, [cartItems, getTotalPrice]);


  // Hàm mới để lấy giá của một sản phẩm cụ thể
  const getItemPrice = useCallback((MaSanPham) => {
    const item = cartItems.find(item => item.MaSanPham === MaSanPham);
    return item ? Number(item.GiaBan) : null;
  }, [cartItems]);

  return (
    <CartContext.Provider value={{ cartItems, updateCart, addToCart, totalPrice, updateQuantity, removeFromCart, toggleItemSelection, getTotalPrice, getItemPrice, removeItemsFromCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)