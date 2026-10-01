import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Item from '../component/Item';
import { useCart } from '../component/CartContext'
import Cookies from 'js-cookie';
import ProductReviews from '../component/ProductReviews';

const ProductDetails = () => {
  const baseURL = process.env.REACT_APP_API_BASE_URL;
  const { id } = useParams()
  const [products, setProducts] = useState([])
  const [productSample, setProductSample] = useState([]);
  const [selectedColor, setSelectedColor] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState([])
  const [selectedSize, setSelectedSize] = useState([]);
  
  const [productdetails, setProductdetails] = useState([]);
  const [error,] = useState(null);
  const [mainImage, setMainImage] = useState(''); // Trạng thái cho ảnh chính
  const { addToCart, } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${baseURL}/data/products`); //http://localhost:3001/data/products
        const data = await response.json();
        console.log('Fetched data:', data); // Kiểm tra dữ liệu từ API

        if (data && data.products && typeof data.products === 'object') {
          const productsArray = Object.values(data.products);
          console.log('Products array:', productsArray); // Kiểm tra dữ liệu sau khi chuyển đổi thành mảng
          setProducts(productsArray);

          // Tìm sản phẩm theo ID
          const foundProduct = productsArray.find(product => product.MaSanPham === Number(id));
          setProductdetails(foundProduct);

          if (foundProduct) {
            setMainImage(foundProduct.HinhAnhChinh); // Cập nhật ảnh chính mặc định
          }
        } else {
          console.error('Lỗi dữ liệu:', data);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchProducts(); // Gọi hàm fetchProducts để thực hiện việc lấy dữ liệu
    window.scrollTo(0, 0); // Cuộn lên đầu trang mỗi khi id thay đổi
  }, [id, baseURL]);

  useEffect(() => {
    const fetchProductSample = async () => {
      try {
        const response = await fetch(`${baseURL}/data/productsample`); //http://localhost:3001/data/productsample
        const data = await response.json();
        if (data && data.productsample && typeof data.productsample === 'object') {
          const productsArray = Object.values(data.productsample);
          setProductSample(productsArray);
        } else {
          console.error('Lỗi dữ liệu:', data);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchProductSample();
  }, [baseURL]);

  if (error) return <p>{error}</p>;
  if (!productdetails) return <p>Loading...</p>;

  const filteredProducts = products.filter(product => product.MaLoai === productdetails.MaLoai);

  const handleThumbnailClick = (image) => {
    setMainImage(image); // Cập nhật ảnh chính khi bấm vào ảnh nhỏ
  };

  const handleAddToCart = async () => {
    if (productdetails) {

        const selectedSample = productSample.find(sample =>
            sample.MaSanPham === productdetails.MaSanPham &&
            (sample.MauSac === selectedColor || !sample.MauSac) &&
            (sample.KichThuoc === selectedSize || !sample.KichThuoc) &&
            (sample.KieuDang === selectedStyle || !sample.KieuDang)
        );

        if (!selectedSample) {
            alert('Vui lòng chọn đầy đủ thông tin sản phẩm.');
            return;
        }

        const price = productdetails.GiaBan;

        console.log('Price from productdetails:', price);
        console.log('Selected sample:', selectedSample);

        if (typeof price !== 'number' || isNaN(price)) {
            console.error('Giá bán không hợp lệ:', price);
            alert('Không thể thêm sản phẩm vào giỏ hàng do giá không hợp lệ.');
            return;
        }

        // Kiểm tra đăng nhập TRƯỚC khi thêm vào giỏ
        const user = Cookies.get('user');

        console.log('User from cookie:', user);

        if (!user) {
            console.error('No user found in cookie');
            navigate('/login');
            return;
        }

        // MaMau chính là ID của biến thể sản phẩm
        const MaMau = selectedSample.MaMau;

        await addToCart(
            price,
            1,
            MaMau
        );

        setIsAdded(true);

        setTimeout(() => {
            setIsAdded(false);
        }, 3000);
    }
  };

  // Gọi api hành vi người dùng
  const userAction = async (MaSanPham, LoaiHanhVi) => {
    try{
      const response = await fetch(`${baseURL}/api/user-action`, { //http://localhost:3001/api/user-action
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

  console.log('Full Product Sample:', JSON.stringify(productSample, null, 2));
  console.log('Product details:', productdetails.MaSanPham);
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-center items-start py-8">
        {/* Ảnh chính */}
        <div className="w-full md:w-1/2 px-4">
          <img
            src={`${mainImage}`} //={`/images/${mainImage}
            alt={productdetails.TenSanPham}
            className="w-full h-auto rounded-lg shadow-md mb-4"
          />

          {/* Ảnh nhỏ */}
          <div className="flex justify-center space-x-4">
            <img
              src={`${productdetails.HinhAnhChinh}`}///images/${productdetails.HinhAnhChinh}
              alt={productdetails.TenSanPham}
              className="w-16 h-16 rounded-md shadow-sm hover:shadow-md cursor-pointer"
              onClick={() => handleThumbnailClick(productdetails.HinhAnhChinh)}
            />
            <img
              src={`${productdetails.AnhChiTiet01}`} ///images/${productdetails.AnhChiTiet01}
              alt={productdetails.TenSanPham}
              className="w-16 h-16 rounded-md shadow-sm hover:shadow-md cursor-pointer"
              onClick={() => handleThumbnailClick(productdetails.AnhChiTiet01)}
            />
            <img
              src={`${productdetails.AnhChiTiet02}`} ///images/${productdetails.AnhChiTiet02}
              alt={productdetails.TenSanPham}
              className="w-16 h-16 rounded-md shadow-sm hover:shadow-md cursor-pointer"
              onClick={() => handleThumbnailClick(productdetails.AnhChiTiet02)}
            />
            <img
              src={`${productdetails.AnhChiTiet03}`} ///images/${productdetails.AnhChiTiet03}
              alt={productdetails.TenSanPham}
              className="w-16 h-16 rounded-md shadow-sm hover:shadow-md cursor-pointer"
              onClick={() => handleThumbnailClick(productdetails.AnhChiTiet03)}
            />
            <img
              src={`${productdetails.AnhChiTiet04}`} ///images/${productdetails.AnhChiTiet04}
              alt={productdetails.TenSanPham}
              className="w-16 h-16 rounded-md shadow-sm hover:shadow-md cursor-pointer"
              onClick={() => handleThumbnailClick(productdetails.AnhChiTiet04)}
            />
          </div>
        </div>

        <div className="w-full md:w-1/2 px-4 mt-8 md:mt-0">
          <h1 className="text-2xl font-bold">Sản Phẩm: {productdetails.TenSanPham}</h1>
          <h3 className="text-2xl font-bold">Thương Hiệu: {productdetails.ThuongHieu}</h3>
          <p className="text-gray-500 text-lg mt-2">Giá Bán: {productdetails.GiaBan}</p>

          {/* <div className="flex items-center mt-4 ml-[125px] sm:ml-[225px]">
            <span className="text-yellow-500 mr-2">★</span>
            <span className="text-yellow-500 mr-2">★</span>
            <span className="text-yellow-500 mr-2">★</span>
            <span className="text-yellow-500 mr-2">★</span>
            <span className="text-gray-400 mr-2">☆</span>
            <span className="text-gray-500 text-sm">(4.0)</span>
          </div> */}

          <p className="text-gray-700 mt-4">
            Mô tả sản phẩm: {productdetails.MoTa}
          </p>

          {/* Chọn màu sắc */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-900">Màu sắc</h3>
            <div className="flex mt-2 space-x-2 justify-center">
              {[...new Set(productSample
                .filter(sample => sample.MaSanPham === productdetails.MaSanPham)
                .map(sample => sample.MauSac))]
                .map((color, index) => (
                  <button
                    key={index}
                    className={`px-3 py-1 border rounded-md ${selectedColor === color ? 'bg-blue-500 text-white' : 'bg-white'} transition-colors duration-150 ease-in-out`}
                    onClick={() => setSelectedColor(color)}
                    style={{ backgroundColor: color }}
                  >
                    {color}
                  </button>
                ))}
            </div>
          </div>

          {/* Chọn kích thước */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-900">Kích thước</h3>
            <div className="flex mt-2 space-x-2 justify-center">
              {[...new Set(productSample
                .filter(sample => sample.MaSanPham === productdetails.MaSanPham)
                .map(sample => sample.KichThuoc))]
                .map((size, index) => (
                  <button
                    key={index}
                    className={`px-3 py-1 border rounded-md ${selectedSize === size ? 'bg-blue-500 text-white' : 'bg-white'} transition-colors duration-150 ease-in-out`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
            </div>
          </div>

          {/* Chọn kiểu dáng */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-900">Kiểu dáng</h3>
            <div className="flex mt-2 space-x-2 justify-center">
              {[...new Set(productSample
                .filter(sample => sample.MaSanPham === productdetails.MaSanPham)
                .map(sample => sample.KieuDang))]
                .map((style, index) => (
                  <button
                    key={index}
                    className={`px-3 py-1 border rounded-md ${selectedStyle === style ? 'bg-blue-500 text-white' : 'bg-white'} transition-colors duration-150 ease-in-out`}
                    onClick={() => setSelectedStyle(style)}
                  >
                    {style}
                  </button>
                ))}
            </div>
          </div>

          <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mt-6"
            onClick={handleAddToCart}
          >
            Add to bag
            {isAdded && (
              <div className="fixed inset-0 flex items-center justify-center">
                <div className="bg-green-500 text-white text-lg px-6 py-3 rounded shadow-md animate-bounce">
                  Sản phẩm đã được thêm vào giỏ hàng
                </div>
              </div>
            )}
          </button>
        </div>
      </div>
      <ProductReviews productId={productdetails.MaSanPham} />
      <h2 className="py-10 text-2xl font-bold tracking-tight text-gray-900">Các sản phẩm có liên quan</h2>
      <Item products={filteredProducts} excludedProductId={productdetails.MaSanPham}/>
    </div>
  );
};

export default ProductDetails;