import React, { useEffect, useState } from 'react';
import rank1 from '../../img/rank-1.png';
import rank2 from '../../img/rank-2.png';
import rank3 from '../../img/rank-3.png';
import rank4 from '../../img/rank-4.png';
import rank5 from '../../img/rank-5.png';
import { Line, Bar} from 'react-chartjs-2';
import { useTable } from 'react-table';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Đăng ký các thành phần cần thiết của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const baseURL = process.env.REACT_APP_API_BASE_URL;

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      font: {
        size: 16
      }
    }
  }
};

const Dashboard = () => {
  // Tính doanh thu theo tháng
  const [revenueData, setRevenueData] = useState({
    labels: [],
    datasets: [{
      label: 'Doanh Thu (VNĐ)',
      data: [],
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1
    }]
  });

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        const response = await fetch(`${baseURL}/api/revenue`); //http://localhost:3001/api/revenue
        const data = await response.json();
  
        // Tạo một mảng chứa tất cả 12 tháng trong năm
        const allMonths = [
          'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
          'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
        ];
  
        // Khởi tạo mảng doanh thu với 0 cho tất cả các tháng
        const revenue = new Array(12).fill(0);  // Khởi tạo tất cả tháng với doanh thu = 0
  
        // Duyệt qua dữ liệu trả về từ API và cập nhật doanh thu cho từng tháng
        // Chuyển từ 'YYYY-MM' thành 'Tháng 1', 'Tháng 2', ...
        data.forEach(item => {
          const monthIndex = parseInt(item.month.split('-')[1], 10) - 1;  // Tách lấy tháng từ 'YYYY-MM'
          if (monthIndex >= 0 && monthIndex < 12) {
            revenue[monthIndex] = item.totalRevenue;
          }
        });
  
        // Cập nhật dữ liệu cho biểu đồ
        setRevenueData({
          labels: allMonths,  // Mảng labels sẽ luôn chứa 12 tháng
          datasets: [{
            label: 'Doanh Thu (VNĐ)',
            data: revenue,  // Dữ liệu doanh thu theo từng tháng
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1
          }]
        });
      } catch (error) {
        console.error('Error fetching revenue data:', error);
      }
    };
  
    fetchRevenueData();
  }, []);

  // Tính sản phẩm bán ra theo tháng
  const [productSalesData, setProductSalesData] = useState({
    labels: [],
    datasets: [{
      label: 'Số Lượng Sản Phẩm Bán Ra',
      data: [],
      backgroundColor: 'rgba(54, 162, 235, 0.6)'
    }]
  });

  useEffect(() => {
    const fetchProductSalesData = async () => {
      try {
        const response = await fetch(`${baseURL}/api/products-sales`); //http://localhost:3001/api/products-sales
        const data = await response.json();
        
        // Tạo một mảng chứa tất cả 12 tháng trong năm
        const allMonths = [
          'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
          'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
        ];
  
        // Khởi tạo mảng doanh thu với 0 cho tất cả các tháng
        const sales = new Array(12).fill(0);  // Khởi tạo tất cả tháng với số lượng sản phẩm bán ra = 0
  
        // Duyệt qua dữ liệu trả về từ API và cập nhật số lượng sản phẩm cho từng tháng
        // Chuyển từ 'YYYY-MM' thành 'Tháng 1', 'Tháng 2', ...
        data.forEach(item => {
          const monthIndex = parseInt(item.month.split('-')[1], 10) - 1;  // Tách lấy tháng từ 'YYYY-MM'
          if (monthIndex >= 0 && monthIndex < 12) {
            sales[monthIndex] = item.totalSales;
          }
        });
  
        // Cập nhật dữ liệu cho biểu đồ
        setProductSalesData({
          labels: allMonths,  // Mảng labels sẽ luôn chứa 12 tháng
          datasets: [{
            label: 'Số Lượng Sản Phẩm Bán Ra',
            data: sales,  // Dữ liệu số lượng sản phẩm bán ra theo từng tháng
            backgroundColor: 'rgba(54, 162, 235, 0.6)'
          }]
        });
      } catch (error) {
        console.error('Error fetching product sales data:', error);
      }
    };
  
    fetchProductSalesData();
  }, []);


  // Tính số lượng tồn kho
  const [inventoryData, setInventoryData] = useState({
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)'
      ]
    }]
  });

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        const response = await fetch(`${baseURL}/api/inventory`); //http://localhost:3001/api/inventory
        const data = await response.json();

        // Extract labels and data for chart
        const labels = data.map(item => item.TenSanPham);
        const totalStock = data.map(item => item.totalStock);
        const totalSold = data.map(item => item.totalSold);
        const remainingStock = data.map(item => item.remainingStock);

        // Update state with fetched data
        setInventoryData({
          labels: labels,
          datasets: [{
            label: 'Tổng số lượng',
            data: totalStock,
            backgroundColor: 'rgba(255, 99, 132, 0.6)'
          }, {
            label: 'Đã bán',
            data: totalSold,
            backgroundColor: 'rgba(54, 162, 235, 0.6)'
          }, {
            label: 'Còn lại',
            data: remainingStock,
            backgroundColor: 'rgba(255, 206, 86, 0.6)'
          }]
        });
      } catch (error) {
        console.error('Error fetching inventory data:', error);
      }
    };

    fetchInventoryData();
  }, []);

  // Tính top sản phẩm bán chạy nhẩt
  const [topProductsData, setTopProductsData] = useState({
    labels: [],
    datasets: [{
        label: 'Số Lượng Bán',
        data: [],
        backgroundColor: 'rgba(153, 102, 255, 0.6)'
    }]
});

useEffect(() => {
  const fetchTopProducts = async () => {
      try {
          const response = await fetch(`${baseURL}/api/top-products`); //http://localhost:3001/api/top-products
          const data = await response.json();
          
          // Chuyển đổi dữ liệu từ API thành định dạng cần thiết cho biểu đồ
          const labels = data.map(product => product.TenSanPham);
          const salesData = data.map(product => product.totalSold);
          
          // Cập nhật state với dữ liệu mới
          setTopProductsData({
              labels: labels,
              datasets: [{
                  label: 'Số Lượng Bán',
                  data: salesData,
                  backgroundColor: 'rgba(153, 102, 255, 0.6)'
              }]
          });
      } catch (error) {
          console.error('Error fetching top products data:', error);
      }
  };

  fetchTopProducts();
}, []);

// Tính top khách hàng mua nhiều nhất
const [topUsersData, setTopUsersData] = useState([]);

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        const response = await fetch(`${baseURL}/api/top-users`); //http://localhost:3001/api/top-users
        const data = await response.json();
        
        const formattedData = data.map((user, index) => ({
          col1: user.TenNguoiDung,         // Tên khách hàng
          rank: index + 1,                 // Xếp hạng
          col2: user.TenDangNhap,          // Tên tài khoản
          col3: user.Email,                 // Email
          col4: user.totalBought,          // Số lượng mua
        }));
        
        setTopUsersData(formattedData);
      } catch (error) {
        console.error('Error fetching top users data:', error);
      }
    };

    fetchTopUsers();
  }, []);

  const columns = React.useMemo(
    () => [
      {
        Header: 'STT',
        accessor: (row, index) => index + 1, // Số thứ tự
      },
      {
        Header: 'Rank',
        accessor: 'rank',
        Cell: ({ value }) => {
          const ranks = [
            rank1,  // Rank 1
            rank2,  // Rank 2
            rank3,  // Rank 3
            rank4,  // Rank 4
            rank5   // Rank 5
          ];
          return <img src={ranks[value - 1]} alt={`Rank ${value}`} className="w-10 h-10" />;
        }
      },
      {
        Header: 'Tên Khách Hàng',
        accessor: 'col1',  // Hiển thị tên khách hàng
      },
      {
        Header: 'Tên Tài Khoản',
        accessor: 'col2',  // Hiển thị tên tài khoản
      },
      {
        Header: 'Email',
        accessor: 'col3',  // Hiển thị email
      },
      {
        Header: 'Số Lượng Mua',
        accessor: 'col4',  // Hiển thị số lượng mua
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data: topUsersData });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Bảng Thống Kê Bán Hàng
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Biểu đồ Doanh Thu */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">Doanh Thu Theo Tháng</h2>
          <Line data={revenueData} options={{
            ...chartOptions,
            plugins: {
              ...chartOptions.plugins,
              title: {
                ...chartOptions.plugins.title,
                text: 'Doanh Thu Theo Tháng'
              }
            }
          }} />
        </div>

        {/* Biểu đồ Số Lượng Sản Phẩm Bán Ra */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">Số Lượng Sản Phẩm Bán Ra</h2>
          <Bar data={productSalesData} options={{
            ...chartOptions,
            plugins: {
              ...chartOptions.plugins,
              title: {
                ...chartOptions.plugins.title,
                text: 'Số Lượng Sản Phẩm Bán Ra'
              }
            }
          }} />
        </div>

        {/* Biểu đồ Tồn Kho */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">Thống Kê Tồn Kho</h2>
          <Bar data={inventoryData} options={{
            ...chartOptions,
            indexAxis: 'y',
            plugins: {
              ...chartOptions.plugins,
              title: {
                ...chartOptions.plugins.title,
                text: 'Thống Kê Tồn Kho'
              }
            }
          }} />
        </div>

        {/* Biểu đồ Top Sản Phẩm */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">Top Sản Phẩm Bán Chạy</h2>
          <Bar 
            data={topProductsData} 
            options={{
              ...chartOptions,
              indexAxis: 'y', // Đây là key để chuyển thành biểu đồ thanh ngang
              plugins: {
                ...chartOptions.plugins,
                title: {
                  ...chartOptions.plugins.title,
                  text: 'Top 5 Sản Phẩm Bán Chạy Nhất'
                }
              }
            }} 
          />
        </div>

        {/* Bảng Top Khách Hàng */}
        <div className="bg-white shadow-lg rounded-lg p-6 md:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">Top Khách Hàng Mua Nhiều Nhất</h2>
          <div className="overflow-x-auto">
          <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {headerGroups.map(headerGroup => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map(column => (
                    <th {...column.getHeaderProps()} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column.render('Header')}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
              {rows.map(row => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()}>
                    {row.cells.map(cell => (
                      <td {...cell.getCellProps()} className="px-6 py-4 whitespace-nowrap">
                        {cell.render('Cell')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
