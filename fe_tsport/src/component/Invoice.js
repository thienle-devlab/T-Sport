import React, { useEffect, useState } from 'react'

import money from '../img/money.png'
import transfer from '../img/transfer.png'
import atm from '../img/atm.png'
import { useLocation, useNavigate, } from 'react-router-dom';
import { useCart } from './CartContext';

function Invoice() {
    const baseURL = process.env.REACT_APP_API_BASE_URL;
    const [paymentMethod, setPaymentMethod] = useState('Chuyển khoản');
    const [orderDate, setOrderDate] = useState('');
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [formData, setFormData] = useState({
        TenNguoiNhan: '',
        DiaChiGiaoHang: '',
        SDTNguoiNhan: '',
        GhiChu: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const location = useLocation();
    const navigate = useNavigate();
    const { selectedItems, total, IdItems } = location.state || {};
    const { removeItemsFromCart } = useCart();

    // Lấy ngày hiện tại khi component mount
    useEffect(() => {
        const currentDate = new Date().toLocaleDateString('en-GB'); // định dạng dd/mm/yyyy
        setOrderDate(currentDate);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
          ...prevState,
          [name]: value
        }));
      };

    const handlePaymentMethodChange = (event) => {
        setPaymentMethod(event.target.value);
    };

    // const handleSubmit = (event) => {
    //     event.preventDefault();
    //     // Hiển thị thông báo mua hàng thành công
    //     setShowSuccessMessage(true);
    //     // Chuyển hướng về trang chủ sau 3 giây
    //     setTimeout(() => {
    //         navigate('/');
    //     }, 1000);
    // };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
    
        try {
        
        // Gọi api hành vi người dùng (mã sản phẩm và hành vi 'mua')
        if (selectedItems.length > 0) {
            await Promise.all(
                IdItems.map(item => {
                    if (item.MaSanPham) { // Kiểm tra MaSanPham có hợp lệ
                        return userAction(item.MaSanPham, 'mua');
                    } else {
                        console.error('Missing MaSanPham for item', item);
                    }
                })
            );
        }

            const response = await fetch(`${baseURL}/api/checkout`, { //http://localhost:3001/api/checkout
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    selectedItems,
                    TongTien: total,
                    ...formData,
                    PhuongThucThanhToan: paymentMethod
                }),
            });
    
            if (!response.ok) {
                throw new Error('Thanh toán thất bại');
            }
    
            const data = await response.json();
    
            // Xử lý khi thanh toán thành công
            if (Array.isArray(selectedItems) && selectedItems.length > 0) {
                removeItemsFromCart(selectedItems); // Gọi hàm với selectedItems
            }
            
            // Hiển thị thông báo thành công
            alert('Thanh toán thành công!');
            // Chuyển hướng đến trang lịch sử đơn hàng hoặc trang chủ
            navigate('/');
    
        } catch (error) {
            console.error('Lỗi khi thanh toán:', error);
            setError('Đã xảy ra lỗi khi thanh toán. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

      useEffect(() => {
        if (!selectedItems || selectedItems.length === 0) {
          navigate('/cart');
        }
      }, [selectedItems, navigate]);
      
      if (isLoading) {
        return <div>Đang xử lý thanh toán...</div>;
      }

    // Gọi api hành vi người dùng
    const userAction = async (MaSanPham, LoaiHanhVi) => {
        try {
            // Kiểm tra dữ liệu trước khi gửi
        console.log("Sending user action:", { MaSanPham, LoaiHanhVi });
            const response = await fetch(`${baseURL}/api/user-action`, { //http://localhost:3001/api/user-action
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    MaSanPham,
                    LoaiHanhVi
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to log user action');
            }
        } catch (error) {
            console.error('Error logging user action:', error);
        }
    };

    return (
        <div>
            {showSuccessMessage && (
                <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-bold mb-4">Mua hàng thành công!</h2>
                        <p>Đơn hàng của bạn đã được đặt thành công.</p>
                    </div>
                </div>
            )}
            <form className="max-w-md mx-auto bg-white p-6 my-6 rounded-lg shadow-lg" onSubmit={handleSubmit}>
                {/* Divider */}
                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink mx-4 text-gray-500">THÔNG TIN THANH TOÁN</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                {/* Email Address */}
                {/* <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        E-mail
                    </label>
                    <input
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Email address"
                    />
                </div> */}

                {/* Ngày đặt hàng */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Ngày đặt hàng
                    </label>
                    <input
                        type="text"
                        className="w-full bg-gray-100 px-3 py-2 border border-gray-300 rounded-lg"
                        value={orderDate}
                        readOnly
                    />
                </div>

                {/* Name on Card */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Tên người nhận
                    </label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        name="TenNguoiNhan"
                        value={formData.TenNguoiNhan}
                        onChange={handleInputChange}
                        placeholder="Tên người nhận..."
                    />
                </div>

                {/* Card Number */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Địa chỉ giao hàng
                    </label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        name="DiaChiGiaoHang"
                        value={formData.DiaChiGiaoHang}
                        onChange={handleInputChange}
                        placeholder="Địa chỉ..."
                    />
                </div>

                {/* Expiration and CVC */}
                {/* <div className="flex space-x-4 mb-4">
                    <div className="w-1/2">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Expiration date (MM/YY)
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="MM/YY"
                        />
                    </div>
                    <div className="w-1/2">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            CVC
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="CVC"
                        />
                    </div>
                </div> */}

                {/* Address */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Số điện thoại
                    </label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        name="SDTNguoiNhan"
                        value={formData.SDTNguoiNhan}
                        onChange={handleInputChange}
                        placeholder="Số điện thoại..."
                    />
                </div>

                {/* City, State, and Postal Code */}
                {/* <div className="flex space-x-4 mb-4">
                    <div className="w-1/3">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            City
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="City"
                        />
                    </div>
                    <div className="w-1/3">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            State / Province
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="State / Province"
                        />
                    </div>
                    <div className="w-1/3">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Postal code
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Postal code"
                        />
                    </div>
                </div> */}

                {/* Billing Address Checkbox */}
                {/* <div className="flex items-center mb-4">
                    <input
                        id="same-address"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label
                        htmlFor="same-address"
                        className="ml-2 block text-gray-900 text-sm"
                    >
                        Billing address is the same as shipping address
                    </label>
                </div> */}

                {/* Phần phương thức thanh toán */}
                <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Payment Method</h3>
                    <div className="space-y-3">
                        <label className="flex items-center bg-white p-4 rounded-lg shadow">
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="Tiền mặt"
                                checked={paymentMethod === 'Tiền mặt'}
                                onChange={handlePaymentMethodChange}
                                className="form-radio h-5 w-5 text-blue-600"
                            />
                            <img
                                src={money}
                                alt="Money"
                                className="h-6 w-10 ml-4"
                            />
                            <span className="ml-4">Tiền mặt</span>
                        </label>

                        <label className="flex items-center bg-white p-4 rounded-lg shadow">
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="Chuyển khoản"
                                checked={paymentMethod === 'Chuyển khoản'}
                                onChange={handlePaymentMethodChange}
                                className="form-radio h-5 w-5 text-blue-600"
                            />
                            <img
                                src={transfer}
                                alt="transfer"
                                className="h-6 w-10 ml-4"
                            />
                            <span className="ml-4">Chuyển khoản</span>
                        </label>

                        <label className="flex items-center bg-white p-4 rounded-lg shadow">
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="Thẻ tín dụng"
                                checked={paymentMethod === 'Thẻ tín dụng'}
                                onChange={handlePaymentMethodChange}
                                className="form-radio h-5 w-5 text-blue-600"
                            />
                            <img
                                src={atm}
                                alt="atm"
                                className="h-6 w-10 ml-4"
                            />
                            <span className="ml-4">Thẻ tín dụng</span>
                        </label>
                    </div>
                </div>

                {/* Phần tổng tiền */}
                <div className="flex justify-between font-bold text-lg mt-4">
          <span>Order Total</span>
          <span>{total?.toLocaleString('de-DE')} VND</span>
        </div>

                {/* Nút thanh toán */}
                <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg mt-6 hover:bg-indigo-700">
                    Pay Now
                </button>
            </form>

        </div>
    )
}

export default Invoice