// import logo from './logo.svg';
import './App.css';
// import Navbar from './component/Navbar';
import Home from './Home/Home';
// import Footer from './component/Footer';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Products from './Products/Products';
// import bannerKids from './img/banner-kids.jpg'
// import bannerMen from './img/banner-men.jpg'
// import bannerWomen from './img/banner-women.jpg'
import ProductDetails from './ProductDetails/ProductDetails';
import { CartProvider } from './component/CartContext';
import ShoppingCart from './ShoppingCart/ShoppingCart';
import SearchItems from './SearchItems/SearchItems';
import { useEffect, useState } from 'react';
import Checkout from './Checkout/Checkout';
import Login from './component/Login';
import Register from './component/Register';
import ForgotPassword from './component/ForgotPassword';
import ProductsList from './component/ProductsList';
import OrderHistory from './component/OrderHistory';
import { UserProvider } from './component/UserContext';
import ClientLayout from './Layout/ClientLayout';
import AdminLayout from './Layout/AdminLayout';
import Dashboard from './Admin/Dashboard/Dashboard';
import ProductSamplesAd from './Admin/ProductSamples/ProductSamples';
import ProductsAd from './Admin/Products/Products';
import CategoryAd from './Admin/Category/Category';
import ListOfCustomers from './Admin/Users/Users';
import OrderAd from './Admin/Orders/Orders';
import ProtectedRoute from './component/ProtectedRoute';


function App() {
  const baseURL = process.env.REACT_APP_API_BASE_URL;
  const [products, setProducts] = useState([]);
  const [, setFilteredProducts] = useState([]);
  const [, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${baseURL}/data/products`); //http://localhost:3001/data/products
        const data = await response.json();

        if (data && data.products && typeof data.products === 'object') {
          const productsArray = Object.values(data.products);
          setProducts(productsArray);
          setFilteredProducts(productsArray);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, [baseURL]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredProducts(products);
    } else {
      const lowerCaseQuery = query.toLowerCase();
      const results = products.filter(product =>
        product.TenSanPham.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredProducts(results);
    }
  };
  return (
    <div className="App">
      <UserProvider>
      <CartProvider>
      <BrowserRouter>       
        
        <Routes>
          {/* Routes cho phần bán hàng */}
          <Route path='/' element={<ClientLayout onSearch={handleSearch} />}>
            <Route index element={<Home />} />
            <Route path='/productslist' element={<ProductsList />} />
            <Route path='/category/:id' element={<Products />} />
            <Route path='/productdetails/:id' element={<ProductDetails />} />
            <Route path='/shoppingcart' element={<ShoppingCart />} />
            <Route path='/orderhistory' element={<OrderHistory />} />
            <Route path='/searchitems' element={<SearchItems />} />
            <Route path='/checkout' element={<Checkout />} />
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/forgotpassword' element={<ForgotPassword />} />
          </Route>
          {/* <Route path='/' element={<Home banner={bannerMen} />} />
          <Route path='/category/:id' element={<Home banner={bannerMen} />} />
          <Route path='/productdetails/:id' element={<ProductDetails />} /> */}

          {/* Routes cho dashboard admin */}
          <Route path="/admin/*" element={<ProtectedRoute requiredRole="Admin"><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="category-ad" element={<CategoryAd />} />
              <Route path="products-ad" element={<ProductsAd />} />
              <Route path="products-samples-ad" element={< ProductSamplesAd/>} />
              <Route path="users-ad" element={<ListOfCustomers />} />
              <Route path="orders-ad" element={<OrderAd />} />
          </Route>
        </Routes>
        
      </BrowserRouter>
      </CartProvider>
      </UserProvider>
    </div>
  );
}

export default App;
