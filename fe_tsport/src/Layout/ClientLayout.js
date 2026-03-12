import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../component/Navbar';
import Footer from '../component/Footer';

const ClientLayout = ({ onSearch }) => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const baseURL = process.env.REACT_APP_API_BASE_URL;

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
    }, []);

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
        // Gọi onSearch prop
        onSearch(query);
    };

    return (
        <div>
            <Navbar onSearch={handleSearch} />
            <main>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

export default ClientLayout;
