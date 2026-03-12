import React, { useEffect, useState } from 'react';
import { AiOutlineClockCircle, AiOutlineCheckCircle, AiOutlineCar, AiOutlineInbox, AiOutlineClose, AiOutlineDelete } from 'react-icons/ai';
import CommentsAndReviews from './CommentsAndReviews';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(null);
  const baseURL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${baseURL}/data/order-history`, { //http://localhost:3001/data/order-history
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(data);
        setOrders(data);
      } catch (error) {
        console.error('Lỗi khi lấy lịch sử mua hàng:', error);
      }
    };

    fetchOrders();
  }, []);

  // Hàm hủy đơn hàng
  const handleCancelOrder = async (orderId) => {
    try {
        const response = await fetch(`${baseURL}/api/order/cancel/${orderId}`, { //http://localhost:3001/api/order/cancel/${orderId}
            method: 'PUT',
            credentials: 'include',
        });

        if (response.ok) {
            // Cập nhật lại danh sách đơn hàng
            setOrders(orders.filter(order => order.id !== orderId));
            console.log(`Hủy đơn hàng ${orderId} thành công`);
        } else {
            console.error('Lỗi khi hủy đơn hàng');
        }
    } catch (error) {
        console.error('Lỗi khi hủy đơn hàng:', error);
    }
};

// Hàm hủy sản phẩm trong đơn hàng
const handleCancelItem = async (orderId, itemId) => {
    try {
        const response = await fetch(`${baseURL}/api/order/cancel-item/${orderId}/${itemId}`, { //http://localhost:3001/api/order/cancel-item/${orderId}/${itemId}
            method: 'PUT',
            credentials: 'include',
        });

        if (response.ok) {
            // Cập nhật lại danh sách sản phẩm trong đơn hàng
            setOrders(orders.map(order => {
                if (order.id === orderId) {
                    return {
                        ...order,
                        items: order.items.filter(item => item.id !== itemId) // Ẩn sản phẩm đã hủy
                    };
                }
                return order;
            }));
            console.log(`Hủy sản phẩm ${itemId} thành công`);
        } else {
            console.error('Lỗi khi hủy sản phẩm');
        }
    } catch (error) {
        console.error('Lỗi khi hủy sản phẩm:', error);
    }
};

  const getStatusIcon = (status) => {
    switch (status) {
      case "Chờ xác nhận":
        return <AiOutlineClockCircle className="w-6 h-6" />;
      case "Đã xác nhận":
        return <AiOutlineCheckCircle className="w-6 h-6" />;
      case "Đang giao":
        return <AiOutlineCar className="w-6 h-6" />;
      case "Hoàn Thành":
        return <AiOutlineInbox className="w-6 h-6" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "Chờ xác nhận":
        return "Chờ xác nhận";
      case "Đã xác nhận":
        return "Đã xác nhận";
      case "Đang giao":
        return "Đang giao";
      case "Hoàn Thành":
        return "Hoàn thành";
      default:
        return "";
    }
  };

//   const handleCancelOrder = (orderId) => {
//     console.log(`Hủy đơn hàng ${orderId}`);
//   };

//   const handleCancelItem = (orderId, itemId) => {
//     console.log(`Hủy sản phẩm ${itemId} từ đơn hàng ${orderId}`);
//   };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
       {orders.length === 0 ? (
      <div className="text-center text-lg text-gray-500 py-4">
        Không có sản phẩm nào trong lịch sử đơn hàng.
      </div>
    ) : (
      orders.map((order) => (
        <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-semibold">Đơn hàng #{order.id}</h3>
              <p className="text-sm text-gray-500">Đặt ngày {order.date}</p>
            </div>
            {order.items.some(item => item.status === "Chờ xác nhận") && ( // Kiểm tra xem có sản phẩm nào đang chờ xác nhận không
                <button 
                    onClick={() => handleCancelOrder(order.id)}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
                >
                    <AiOutlineClose className="w-4 h-4" />
                    Hủy đơn hàng
                </button>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
                {["Chờ xác nhận", "Đã xác nhận", "Đang giao", "Hoàn Thành"].map((status) => {
                    // Kiểm tra trạng thái hiện tại của sản phẩm
                    const isCurrentStatus = order.items.some(item => item.status === status);
                    return (
                        <div 
                            key={status}
                            className={`flex flex-col items-center ${isCurrentStatus ? "text-blue-600" : "text-gray-400"}`}
                        >
                            {getStatusIcon(status)} {/* Hiển thị biểu tượng trạng thái */}
                            <span className="text-xs mt-1">{getStatusText(status)}</span>
                        </div>
                    );
                })}
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
                <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{
                        width: (() => {
                            const itemStatus = order.items[0]?.status; // Lấy trạng thái của item đầu tiên
                            switch (itemStatus) {
                                case "Chờ xác nhận": return "25%";
                                case "Đã xác nhận": return "50%";
                                case "Đang giao": return "75%";
                                case "Hoàn Thành": return "100%";
                                default: return "0%";
                            }
                        })()
                    }}
                />
            </div>
        </div>

          {/* Order items */}
          {order.items.map((item) => (
            <div key={item.id} className="flex mb-4 border-b pb-4">
              {/* Image */}
              <div className="w-24 flex-shrink-0">
                <img
                  src={`${item.productImage}`} ///images/${item.productImage}
                  alt={item.productName}
                  className="w-24 h-24 object-cover rounded"
                />
              </div>

              {/* Product Info - Centered */}
              <div className="flex-grow flex items-center justify-between px-4">
                <div className="flex flex-col justify-center w-full px-4">
                  <h4 className="font-medium">{item.productName}</h4>
                  <p className="text-gray-600 text-sm mt-1">Số lượng: {item.quantity}</p>
                  <p className="text-gray-600 text-sm mt-1">Màu sắc: {item.color}</p>
                  <p className="text-gray-600 text-sm mt-1">Kích thước: {item.size}</p>
                  <p className="text-gray-600 text-sm mt-1">Kiểu dáng: {item.style}</p>
                  <p className="text-blue-600 font-medium mt-2">${item.price.toFixed(2)}</p>
                </div>

                {/* Cancel Button */}
                {item.status === "Chờ xác nhận" && order.items.length > 1 && (
                  <div className="flex-shrink-0">
                    <button 
                      onClick={() => handleCancelItem(order.id, item.id)}
                      className="flex items-center gap-1 px-2 py-1 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Hủy sản phẩm này"
                    >
                      <AiOutlineDelete className="w-4 h-4" />
                      Hủy
                    </button>
                  </div>
                )}
              </div>

              {/* Comments and Reviews cho từng sản phẩm */}
              {item.status === "Hoàn Thành" && (
                <div className="mt-4 ml-28">
                  <CommentsAndReviews productId={item.productId} />
                </div>
              )}

            </div>
          ))}

          {/* Shipping info */}
          <div className="grid grid-cols-3 gap-4">
            <div>
                <h4 className="font-medium mb-2">Tên người nhận</h4>
                <p className="text-sm text-gray-600">{order.name}</p>
            </div>
            <div>
                <h4 className="font-medium mb-2">Địa chỉ giao hàng</h4>
                <p className="text-sm text-gray-600">
                {order.address}<br />
                </p>
            </div>
            <div>
                <h4 className="font-medium mb-2">Thông tin liên hệ</h4>
                <p className="text-sm text-gray-600">{order.phone}</p>
            </div>
        </div>

        {/* Review Button */}
        {/* <button
            onClick={() => setShowReviewForm(showReviewForm === order.id ? null : order.id)}
            className="mt-4 px-4 py-2 text-sm text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors"
          >
            Đánh giá sản phẩm
        </button> */}

          {/* Comments and Reviews */}
          {/* {showReviewForm === order.id && (
            <CommentsAndReviews productId={order.items[0].productId} />
          )} */}

          {/* Comments and Reviews - Chỉ hiển thị khi đơn hàng hoàn thành */}

          {/* {order.items.every(item => item.status === "Hoàn Thành") && (
            <div className="mt-4">
              <CommentsAndReviews productId={order.items[0].productId} />
            </div>
          )} */}

        </div>
      )))}
    </div>
  );
};

export default OrderHistory;
