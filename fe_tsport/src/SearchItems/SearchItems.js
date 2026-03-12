import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Item from '../component/Item';

const SearchItems = () => {
  const baseURL = process.env.REACT_APP_API_BASE_URL;
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const query = queryParams.get('query');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${baseURL}/data/products`); //http://localhost:3001/data/products
        const data = await response.json();

        if (data && data.products && typeof data.products === 'object') {
          const productsArray = Object.values(data.products);
          setProducts(productsArray);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    setSearchQuery(query || '');
    if (query && query.trim() !== '') {
      const lowerCaseQuery = query.toLowerCase();
      const results = products.filter(product =>
        product.TenSanPham.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredProducts(results);
    } else {
      setFilteredProducts(products);
    }
  }, [query, products]);

  return (
    <div>
      <div className="container mx-auto px-4 py-6">
        {searchQuery && (
          <h2 className="text-xl font-semibold mb-4">
            Kết quả tìm kiếm cho "{searchQuery}"
          </h2>
        )}
        {filteredProducts.length === 0 ? (
          <div className="text-center text-gray-500">
            Không có sản phẩm nào phù hợp với tìm kiếm của bạn.
          </div>
        ) : (
          <Item products={filteredProducts} />
        )}
      </div>
    </div>
  );
};

export default SearchItems;
