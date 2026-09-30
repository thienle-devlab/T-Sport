import { useEffect, useState } from 'react'
import SidebarCatagory from '../component/SidebarCatagory'
import { useParams } from 'react-router-dom'
import Item from '../component/Item'

function Products() {
    const [products, setProducts] = useState([]);
    const {id}  = useParams()
    const baseURL = process.env.REACT_APP_API_BASE_URL;
    
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
          } else {
            console.error('Lỗi dữ liệu:', data);
          }
        } catch (error) {
          console.error('Error:', error);
        }
      };
  
      fetchProducts(); // Gọi hàm fetchProducts để thực hiện việc lấy dữ liệu
    }, [baseURL]);

      // Lọc sản phẩm dựa trên loại đã chọn
      const filteredProducts = products.filter(product => product.MaLoai === Number(id));

      

    return (
      <div className="flex space-x-4">
      <div className="w-2/8">
        <SidebarCatagory />
      </div>
      <div className="w-6/8">
        <Item products={filteredProducts} />
      </div>
    </div>
    );
}


export default Products