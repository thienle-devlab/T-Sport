import { useEffect, useState } from 'react';
import { FaCheck, FaTimes, FaTruck, FaBox, FaExclamationCircle, FaShippingFast, FaTrash } from 'react-icons/fa';

const ORDER_STATUS = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Hoàn Thành',
  CANCELLED: 'Đã Hủy'
};

const OrdersAd = () => {
  const [activeTab, setActiveTab] = useState(ORDER_STATUS.PENDING);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const baseURL = process.env.REACT_APP_API_BASE_URL;

  

  useEffect(() => {
    const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${baseURL}/data/admin/orders`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', error);
      setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

    fetchOrders();
  }, [baseURL]);

  // Xử lý cập nhật trạng thái đơn hàng
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${baseURL}/api/order/${newStatus}/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.id === orderId) {
            return {
              ...order,
              items: order.items.map(item => 
                item.status !== ORDER_STATUS.CANCELLED 
                  ? { ...item, status: newStatus }
                  : item
              )
            };
          }
          return order;
        })
      );
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleCancelItem = async (orderId, itemId) => {
    try {
      const response = await fetch(`${baseURL}/api/order/cancel-item/${orderId}/${itemId}`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel order item');
      }

      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.id === orderId) {
            return {
              ...order,
              items: order.items.map(item => 
                item.id === itemId 
                  ? { ...item, status: ORDER_STATUS.CANCELLED }
                  : item
              )
            };
          }
          return order;
        })
      );
    } catch (error) {
      console.error('Error canceling order item:', error);
    }
  };

  // Tạo hàm helper để lọc và nhóm items theo status
  // const getItemsByStatus = (items, status) => {
  //   return items.filter(item => item.status === status);
  // };

  //Trạng thái đơn hàng
  const OrderStatusActions = ({ order }) => {
    // Nếu đơn hàng đã hoàn thành, hiển thị text màu xanh
    if (order.status === ORDER_STATUS.COMPLETED) {
      return (
        <div className="flex items-center gap-2 text-green-600 font-medium">
          <FaCheck className="w-4 h-4" />
          <span>Đã hoàn thành đơn hàng</span>
        </div>
      );
    }
  
    // Nếu đơn hàng đã hủy, hiển thị text màu đỏ
    if (order.status === ORDER_STATUS.CANCELLED || order.items.status === ORDER_STATUS.CANCELLED) {
      return (
        <div className="flex items-center gap-2 text-red-600 font-medium">
          <FaTimes className="w-4 h-4" />
          <span>Đơn hàng đã bị hủy</span>
        </div>
      );
    }
  
    const getActions = () => {
      switch (order.status) {
        case ORDER_STATUS.PENDING:
          return [
            {
              label: 'Duyệt đơn',
              action: () => handleUpdateOrderStatus(order.id, ORDER_STATUS.CONFIRMED),
              icon: FaCheck,
              color: 'green'
            },
            {
              label: 'Từ chối',
              action: () => handleUpdateOrderStatus(order.id, ORDER_STATUS.CANCELLED),
              icon: FaTimes,
              color: 'red'
            }
          ];
        case ORDER_STATUS.CONFIRMED:
          return [
            {
              label: 'Bắt đầu giao hàng',
              action: () => handleUpdateOrderStatus(order.id, ORDER_STATUS.SHIPPING),
              icon: FaTruck,
              color: 'blue'
            }
          ];
        case ORDER_STATUS.SHIPPING:
          return [
            {
              label: 'Xác nhận hoàn thành',
              action: () => handleUpdateOrderStatus(order.id, ORDER_STATUS.COMPLETED),
              icon: FaCheck,
              color: 'green'
            }
          ];
        default:
          return [];
      }
    };
  
    const actions = getActions();
  
    return (
      <div className="flex gap-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border
              ${action.color === 'green' 
                ? 'border-green-200 text-green-600 hover:bg-green-50'
                : action.color === 'red'
                ? 'border-red-200 text-red-600 hover:bg-red-50'
                : 'border-blue-200 text-blue-600 hover:bg-blue-50'
              }`}
          >
            <action.icon className="w-4 h-4" />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    );
  };

  const OrderCard = ({ order }) => {
    // Lọc items theo trạng thái đang active
    const itemsToShow = order.items.filter(item => item.status === activeTab);
    
    // Nếu không có items nào ở trạng thái này, không hiển thị card
    if (itemsToShow.length === 0) return null;

    // Tính toán trạng thái chung của đơn hàng
    const hasNonCancelledItems = order.items.some(item => item.status !== ORDER_STATUS.CANCELLED);
    const orderStatus = hasNonCancelledItems 
      ? order.items.find(item => item.status !== ORDER_STATUS.CANCELLED)?.status || ORDER_STATUS.PENDING
      : ORDER_STATUS.CANCELLED;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Đơn hàng #{order.id}</h3>
              <p className="text-sm text-gray-500">Đặt ngày {order.date}</p>
            </div>
            <div className="flex items-center gap-4">
              {activeTab !== ORDER_STATUS.CANCELLED && hasNonCancelledItems && (
                <OrderStatusActions 
                  order={{ ...order, status: orderStatus }} 
                />
              )}
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Thông tin khách hàng</h4>
              <p className="mb-1">Tên: {order.name}</p>
              <p className="mb-1">Địa chỉ: {order.address}</p>
              <p>SĐT: {order.phone}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Chi tiết đơn hàng</h4>
              <div className="space-y-4">
                {itemsToShow.map((item) => (
                  <div key={item.id} className="flex items-start border-b border-gray-100 pb-4 last:border-0">
                    <img 
                      src={item.productImage}
                      alt={item.productName} 
                      className="w-16 h-16 rounded-md mr-4"
                    />
                    <div className="flex-grow">
                      <p className="font-medium">{item.productName}</p>
                      <p>Số lượng: {item.quantity}</p>
                      <p>Màu sắc: {item.color}</p>
                      <p>Kích thước: {item.size}</p>
                      <p>Kiểu dáng: {item.style}</p>
                      <p className="font-semibold">Giá: {item.totalPrice.toLocaleString()}VNĐ</p>
                    </div>
                    {item.status === ORDER_STATUS.PENDING && (
                      <button
                        onClick={() => handleCancelItem(order.id, item.id)}
                        className="flex items-center gap-1 px-2 py-1 text-red-500 hover:bg-red-50 rounded"
                        title="Hủy sản phẩm này"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Component OrderStatusActions giữ nguyên như cũ

  const TabButton = ({ value, icon: Icon, children }) => {
    // Đếm số lượng items (không phải orders) cho mỗi trạng thái
    const itemCount = orders.reduce((count, order) => {
      return count + order.items.filter(item => item.status === value).length;
    }, 0);
    
    return (
      <button
        onClick={() => setActiveTab(value)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition
          ${activeTab === value 
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
      >
        <Icon className="w-5 h-5" />
        <span>{children}</span>
        <span className="text-sm bg-white text-gray-700 rounded-full w-5 h-5 flex items-center justify-center">
          {itemCount}
        </span>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  // Lọc orders dựa trên việc có ít nhất một item phù hợp với activeTab
  const filteredOrders = orders.filter(order => 
    order.items.some(item => item.status === activeTab)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Quản lý đơn hàng</h2>
        <div className="flex gap-2 bg-white p-2 rounded-lg shadow-sm">
          <TabButton value={ORDER_STATUS.PENDING} icon={FaExclamationCircle}>
            Đang chờ
          </TabButton>
          <TabButton value={ORDER_STATUS.CONFIRMED} icon={FaCheck}>
            Đã duyệt
          </TabButton>
          <TabButton value={ORDER_STATUS.SHIPPING} icon={FaShippingFast}>
            Đang giao
          </TabButton>
          <TabButton value={ORDER_STATUS.COMPLETED} icon={FaBox}>
            Đã hoàn thành
          </TabButton>
          <TabButton value={ORDER_STATUS.CANCELLED} icon={FaTimes}>
            Đã hủy
          </TabButton>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center text-gray-500">Không có đơn hàng nào.</div>
      ) : (
        <div>
          {filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersAd;