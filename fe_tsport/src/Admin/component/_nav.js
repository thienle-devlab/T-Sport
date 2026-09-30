import { 
    MdDashboard, 
    // MdMenu, 
    // MdChevronLeft,
    // MdAnalytics,
    // MdShoppingCart,
    // MdPeople,
    // MdWidgets,
    // MdApps,
    // MdSettings,
    // MdHelpOutline,
    // MdShoppingBasket,
    // MdExpandLess,
    // MdExpandMore,
    MdOutlineShoppingCartCheckout
  } from 'react-icons/md';
import Dashboard from '../Dashboard/Dashboard';
import { LuBoxes } from 'react-icons/lu';
import { BiSolidUserDetail } from "react-icons/bi";
import CategoryAd from '../Category/Category';
import ProductsAd from '../Products/Products';
import ProductSamplesAd from '../ProductSamples/ProductSamples';
import ListOfCustomers from '../Users/Users';
import OrderAd from '../Orders/Orders';


const _nav = [
    {
        component: Dashboard,
        name: 'Dashboard',
        to: '',
        icon: <MdDashboard size={24} />,
        subMenu: []
    },
    {
        name: 'Quản lý sản phẩm',
        icon: <LuBoxes size={24} />,
        subMenu: [
            {
                component: CategoryAd,
                name: 'Loai sản phẩm',
                to: 'category-ad',
            },
            {
                component: ProductsAd,
                name: 'Sản phẩm',
                to: 'products-ad',
            },
            {
                component: ProductSamplesAd,
                name: 'Mẫu sản phẩm',
                to: 'products-samples-ad',
            },
        ]
    },
    {
        component: ListOfCustomers,
        name: 'Danh sách người dùng',
        to: 'users-ad',
        icon: <BiSolidUserDetail size={24} />,
        subMenu: []
    },
    {
        component: OrderAd,
        name: 'Quản lý đơn hàng',
        to: 'orders-ad',
        icon: <MdOutlineShoppingCartCheckout size={24} />,
        subMenu: []
    },

]

export default _nav