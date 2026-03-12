import React, { useEffect, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { NavLink } from 'react-router-dom';
import Cookies from 'js-cookie';


function ProductsList() {
  const baseURL = process.env.REACT_APP_API_BASE_URL;
  const [products, setProducts] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true);
  const [hasUserBehavior, setHasUserBehavior] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [error, setError] = useState(null);

  const [productsPerPage] = useState(20); // Số sản phẩm trên mỗi trang

  // Tính toán các sản phẩm cho trang hiện tại
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

  // Thay đổi trang
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

   // Tính tổng số trang
   const pageNumbers = [];
   for (let i = 1; i <= Math.ceil(products.length / productsPerPage); i++) {
     pageNumbers.push(i);
   }

   // Lấy dữ liệu từ API
   useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Lấy thông tin người dùng từ cookie
        const userCookie = Cookies.get('user');
        console.log('User cookie:', userCookie); // Debug log

        const user = userCookie ? JSON.parse(userCookie) : null;
        console.log('Parsed user:', user); // Debug log

        if (!user) {
          // Nếu chưa đăng nhập, lấy danh sách sản phẩm thông thường
          console.log('No user found, fetching normal products'); // Debug log
          const response = await fetch(`${baseURL}/data/products`, { //http://localhost:3001/data/products
            credentials: 'include'
          });
          const data = await response.json();
          console.log('Normal products data:', data); // Debug log
          
          if (data && data.products && typeof data.products === 'object') {
            const productsArray = Object.values(data.products);
            setProducts(productsArray);
          }
        } else {
          // Nếu đã đăng nhập, kiểm tra hành vi người dùng
          console.log('User found, checking behavior'); // Debug log
          const behaviorCheckResponse = await fetch(`${baseURL}/api/user-behavior/check`, { //http://localhost:3001/api/user-behavior/check
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          const behaviorData = await behaviorCheckResponse.json();
          console.log('Behavior data:', behaviorData); // Debug log
          setHasUserBehavior(behaviorData.hasUserBehavior);

          if (behaviorData.hasUserBehavior) {
            // Lấy sản phẩm đề xuất cho người dùng đã có hành vi
            console.log('User has behavior, fetching recommendations'); // Debug log
            const recommendationsResponse = await fetch(`${baseURL}/api/recommendations`, { //http://localhost:3001/api/recommendations
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            const recommendationsData = await recommendationsResponse.json();
            console.log('Recommendations data:', recommendationsData); // Debug log
            
            if (recommendationsData.status === 'success' && recommendationsData.data) {
              setRecommendedProducts(recommendationsData.data);
            }
          } else {
            // Lấy danh sách sản phẩm thông thường cho người dùng mới
            console.log('New user, fetching normal products'); // Debug log
            const response = await fetch(`${baseURL}/data/products`, { //http://localhost:3001/data/products
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            const data = await response.json();
            console.log('Normal products data for new user:', data); // Debug log
            
            if (data && data.products && typeof data.products === 'object') {
              const productsArray = Object.values(data.products);
              setProducts(productsArray);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Có lỗi xảy ra khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Gọi api hành vi người dùng
  const userAction = async (MaSanPham, LoaiHanhVi) => {
    try{
      const response = await fetch('http://localhost:3001/api/user-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ MaSanPham, LoaiHanhVi }),
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to log user action');
      }
    }
    catch (error) {
      console.error('Error logging user action:', error);
    }
  }

  return (
    <div className="bg-slate-50">
      {loading && <div>Loading...</div>}
      {error && <div>{error}</div>}
      
      {hasUserBehavior ? (
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Sản phẩm đề xuất cho bạn</h2>
          {recommendedProducts && recommendedProducts.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
              {recommendedProducts.map((product) => (
                <div key={product.MaSanPham} className="group relative">
                  <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-80">
                    <img
                      alt={product.TenSanPham}
                      src={`${product.HinhAnhChinh}`} //images/${product.HinhAnhChinh}
                      className="h-full w-full object-cover object-center lg:h-full lg:w-full"
                    />
                  </div>
                  <div className="mt-4 flex justify-between">
                    <div>
                      <h3 className="text-sm text-gray-700">
                        <NavLink to={`/productdetails/${product.MaSanPham}`}
                                 onClick={() => userAction(product.MaSanPham, 'Xem')}
                        >
                          <span aria-hidden="true" className="absolute inset-0" />
                          {product.TenSanPham}
                        </NavLink>
                      </h3>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{product.GiaBan.toLocaleString('de-DE')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>Không có sản phẩm đề xuất</div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Sản phẩm đề xuất cho bạn</h2>
          {products && products.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
              {products.map((product) => (
                <div key={product.MaSanPham} className="group relative">
                  <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-80">
                    <img
                      alt={product.TenSanPham}
                      src={`${product.HinhAnhChinh}`} //images/${product.HinhAnhChinh}
                      className="h-full w-full object-cover object-center lg:h-full lg:w-full"
                    />
                  </div>
                  <div className="mt-4 flex justify-between">
                    <div>
                      <h3 className="text-sm text-gray-700">
                        <NavLink to={`/productdetails/${product.MaSanPham}`}
                                 onClick={() => userAction(product.MaSanPham, 'Xem')}
                        >
                          <span aria-hidden="true" className="absolute inset-0" />
                          {product.TenSanPham}
                        </NavLink>
                      </h3>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{product.GiaBan.toLocaleString('de-DE')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>Không có sản phẩm</div>
          )}
        </div>
      )}
      
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Previous
        </button>
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === Math.ceil(products.length / productsPerPage)}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Next
        </button>
      </div>
      
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{indexOfFirstProduct + 1}</span> to{' '}
            <span className="font-medium">{Math.min(indexOfLastProduct, products.length)}</span> of{' '}
            <span className="font-medium">{products.length}</span> results
          </p>
        </div>
        <div>
          <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md shadow-sm">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeftIcon aria-hidden="true" className="h-5 w-5" />
            </button>
            {pageNumbers.map((number) => {
              if (number === 1 || number === pageNumbers.length || (number >= currentPage - 1 && number <= currentPage + 1)) {
                return (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      currentPage === number
                        ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {number}
                  </button>
                );
              } else if (number === currentPage - 2 || number === currentPage + 2) {
                return <span key={number} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">...</span>;
              }
              return null;
            })}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === Math.ceil(products.length / productsPerPage)}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
            >
              <span className="sr-only">Next</span>
              <ChevronRightIcon aria-hidden="true" className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
  
}

export default ProductsList