import { useEffect } from 'react'
import { useState } from 'react'
import { useCart } from '../component/CartContext';
import Search from '../component/Search';
import Cookies from 'js-cookie';
import Logo from '../img/T-SPORT.png'
import { useUser } from './UserContext';

import { NavLink, useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
  Tab,
  TabGroup,
  TabList,
} from '@headlessui/react'
import { Bars3Icon, ShoppingBagIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { TbShoppingBagCheck } from "react-icons/tb";

function Navbar({ onSearch }) {
  const baseURL = process.env.REACT_APP_API_BASE_URL;
  const [categories, setCategories] = useState([]);
  const [otherCategories, setOtherCategories] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const userCookie = Cookies.get('user');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${baseURL}/data/categories`); //http://localhost:3001/data/categories
        const data = await response.json();
        console.log('Fetched data:', data); // Kiểm tra dữ liệu từ API

        if (data && data.categories && typeof data.categories === 'object') {
          const categoriesArray = Object.values(data.categories);
          console.log('Categories array:', categoriesArray); // Kiểm tra dữ liệu sau khi chuyển đổi thành mảng
          const mainCategories = categoriesArray.filter(category => category.MaLoai <= 3);
          const others = categoriesArray.filter(category => category.MaLoai > 3);
          setCategories(mainCategories);
          setOtherCategories(others);
        } else {
          console.error('Lỗi dữ liệu:', data);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchCategories();
  }, [baseURL]);

  // Cart
const { cartItems } = useCart();

// Tính toán tổng số lượng sản phẩm được chọn (isSelected = true)
const totalQuantity = cartItems.reduce((sum, item) => 
  item.isSelected ? sum + (Number(item.SoLuongSanPham) || 0) : sum, 0
);

  useEffect(() => {
    // Lấy thông tin người dùng từ cookie
    const userType = Cookies.get('LoaiNguoiDung');
    console.log(userCookie, userType);
  
    if (userCookie) {
      try {
        // Phân tích JSON để lấy thông tin người dùng từ cookie
        const loggedInUser = JSON.parse(userCookie);
  
        if (loggedInUser && typeof loggedInUser.TenDangNhap === 'string') {
          setUser({ TenDangNhap: loggedInUser.TenDangNhap, LoaiNguoiDung: userType });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Lỗi phân tích JSON từ cookie:', error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [userCookie]);

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

  // const { setSelectedCategory } = useContext(Context);

  // const handleCategoryClick = (category) => {
  //   setSelectedCategory(category);
  // };

  return (
    <div className="bg-white">
      {/* Mobile menu */}
      <Dialog open={open} onClose={setOpen} className="relative z-40 lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black bg-opacity-25 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
        />

        <div className="fixed inset-0 z-40 flex">
          <DialogPanel
            transition
            className="relative flex w-full max-w-xs transform flex-col overflow-y-auto bg-white pb-12 shadow-xl transition duration-300 ease-in-out data-[closed]:-translate-x-full"
          >
            <div className="flex px-4 pb-2 pt-5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="relative -m-2 inline-flex items-center justify-center rounded-md p-2 text-gray-400"
              >
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="h-6 w-6" />
              </button>
            </div>

            {/* Links */}
            <TabGroup className="mt-2">
              <TabList className='-mb-px flex space-x-8'>
                {categories.map((category) => (
                  <Tab key={category.MaLoai} className={({ selected }) =>
                    `flex-1 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium focus:outline-none
                    ${selected ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}>
                    <NavLink to={`category/${category.MaLoai}`}>
                      {category.TenLoai}
                    </NavLink>
                  </Tab>
                ))}
                {otherCategories.length > 0 && (
                  <div className='relative'>
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className='flex items-center whitespace-nowrap py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700'>
                      Other
                    </button>
                    {isDropdownOpen && (
                      <div className='absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
                        <div className='py-1' role='menu' aria-orientation='vertical' aria-labelledby='options-menu'>
                          {otherCategories.map((category) => (
                            <NavLink
                              key={category.MaLoai}
                              to={`category/${category.MaLoai}`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                            >
                              {category.TenLoai}
                            </NavLink>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabList>
            </TabGroup>
            <div className="space-y-6 border-t border-gray-200 px-4 py-6">
              <div className="flow-root">
                <a href='/' className="-m-2 block p-2 font-medium text-gray-900">
                  About Us
                </a>
              </div>
            </div>

            <div className="space-y-6 border-t border-gray-200 px-4 py-6">
        {user ? (
          <>
            <div className="flow-root">
              <span className="-m-2 block p-2 font-medium text-gray-900">
                {user.TenDangNhap}
              </span>
            </div>
            <div className="flow-root">
              <button
                onClick={handleLogout}
                className="-m-2 block p-2 font-medium text-gray-900"
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flow-root">
              <NavLink
                to={'/login'}
                className="-m-2 block p-2 font-medium text-gray-900"
              >
                Sign in
              </NavLink>
            </div>
            <div className="flow-root">
              <NavLink
                to={'/register'}
                className="-m-2 block p-2 font-medium text-gray-900"
              >
                Create account
              </NavLink>
            </div>
          </>
        )}
      </div>

          </DialogPanel>
        </div>
      </Dialog>

      <header className="fixed top-0 left-0 w-full z-50 bg-white"> {/*nếu là cố định relative bg-white */}
        <p className="flex h-10 items-center justify-center bg-indigo-600 px-4 text-sm font-medium text-white sm:px-6 lg:px-8">
        T-SPORT - Chất lượng hoàn hảo, phong cách dẫn đầu
        </p>

        <nav aria-label="Top" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200">
            <div className="flex h-16 items-center">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="relative rounded-md bg-white p-2 text-gray-400 lg:hidden"
              >
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Open menu</span>
                <Bars3Icon aria-hidden="true" className="h-6 w-6" />
              </button>

              {/* Logo */}
              <div className="ml-4 flex lg:ml-0">
                <NavLink to="/">
                  <span className="sr-only">T-Sport</span>
                  <img
                    alt=""
                    src={Logo}
                    className="h-16 w-auto"
                  />
                </NavLink>
              </div>

              {/* Flyout menus */}
              <PopoverGroup className="hidden lg:ml-8 lg:block lg:self-stretch">
                <div className="flex h-full space-x-8">
                  {categories.map((category) => (
                    <Popover key={category.MaLoai} className="flex">
                      <div className="relative flex">
                        <NavLink to={`category/${category.MaLoai}`} className="relative z-10 -mb-px flex items-center border-b-2 border-transparent pt-px text-sm font-medium text-gray-700 transition-colors duration-200 ease-out hover:text-gray-800 data-[headlessui-state=open]:border-indigo-600 data-[headlessui-state=open]:text-indigo-600"
                        >
                          {category.TenLoai}
                        </NavLink>
                      </div>
                    </Popover>
                  ))}
                  {otherCategories.length > 0 && (
                    <Popover className="relative flex">
                      <div className="relative flex">
                        <PopoverButton className="relative z-10 -mb-px flex items-center border-b-2 border-transparent pt-px text-sm font-medium text-gray-700 transition-colors duration-200 ease-out hover:text-gray-800 data-[headlessui-state=open]:border-indigo-600 data-[headlessui-state=open]:text-indigo-600">
                          Other
                          <svg
                            className="ml-2 h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </PopoverButton>
                        <PopoverPanel className="absolute right-0 mt-[50px] w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                            {otherCategories.map((category) => (
                              <NavLink
                                key={category.MaLoai}
                                to={`category/${category.MaLoai}`}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-slate-100"
                              >
                                {category.TenLoai}
                              </NavLink>
                            ))}
                          </div>
                        </PopoverPanel>
                      </div>
                    </Popover>
                  )}

                  <a
                    href="/"
                    className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-800"
                  >
                    About Us
                  </a>
                </div>
              </PopoverGroup>
              <div className="ml-auto flex items-center">
              <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end lg:space-x-6">
        {user ? (
          <>
            <span className="text-sm font-medium text-gray-700">
              {user.TenDangNhap}
            </span>
            <span aria-hidden="true" className="h-6 w-px bg-gray-200" />
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-700 hover:text-gray-800"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink
              to={'/login'}
              className="text-sm font-medium text-gray-700 hover:text-gray-800"
            >
              Sign in
            </NavLink>
            <span aria-hidden="true" className="h-6 w-px bg-gray-200" />
            <NavLink
              to={'/register'}
              className="text-sm font-medium text-gray-700 hover:text-gray-800"
            >
              Create account
            </NavLink>
          </>
        )}
      </div>

                {/* Search */}
                <div className="flex items-center border border-gray-300 rounded-full bg-white ml-2">
                  {/* Ô nhập liệu */}
                  {/* <input
                    type="text"
                    placeholder="Search..."
                    className="w-full px-3 py-2 border-0 rounded-full outline-none focus:ring-0"
                  />
                  <MagnifyingGlassIcon
                    aria-hidden="true"
                    className="h-10 w-10 text-gray-400 p-2"
                  /> */}
                  <Search onSearch={onSearch} />
                </div>

                {/* Cart */}
                <div className="ml-4 flow-root lg:ml-6">
                  <NavLink to={'/orderhistory'} className="group -m-2 flex items-center p-2">
                    <TbShoppingBagCheck
                      aria-hidden="true"
                      className="h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                    />
                  </NavLink>
                </div>

                <div className="ml-4 flow-root lg:ml-6">
                  <NavLink to={'/shoppingcart'} className="group -m-2 flex items-center p-2">
                    <ShoppingBagIcon
                      aria-hidden="true"
                      className="h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                    />

                    <span className=" text-sm font-medium text-gray-700 group-hover:text-gray-800">
                      <span className="bg-red-500 text-white rounded-full px-[4px] text-xs">{totalQuantity}</span>
                    </span>

                    <span className="sr-only">items in cart, view bag</span>
                  </NavLink>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>
      <div className="h-[112px]"></div>
    </div>
  )
}

export default Navbar