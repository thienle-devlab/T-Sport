import { useEffect, useState } from 'react'
import { Sidebar } from "flowbite-react";
import { NavLink } from 'react-router-dom';

function SidebarCatagory() {
  const baseURL = process.env.REACT_APP_API_BASE_URL;
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
          try {
            const response = await fetch(`${baseURL}/data/categories`); //http://localhost:3001/data/categories
            const data = await response.json();
            console.log('Fetched data:', data); // Kiểm tra dữ liệu từ API
    
            if (data && data.categories && typeof data.categories === 'object') {
              const categoriesArray = Object.values(data.categories);
              console.log('Categories array:', categoriesArray); // Kiểm tra dữ liệu sau khi chuyển đổi thành mảng
              setCategories(categoriesArray);
            } else {
              console.error('Lỗi dữ liệu:', data);
            }
          } catch (error) {
            console.error('Error:', error);
          }
        };
    
        fetchCategories();
      }, [baseURL]);

  return (
    <Sidebar aria-label="Default sidebar example">
  <Sidebar.Items>
    <Sidebar.ItemGroup>
      {categories.map((category) => (      
          <NavLink
            to={`/category/${category.MaLoai}`} 
            className="text-left"
            style={{ textDecoration: 'none', color: 'inherit' }} // Optional styles
            activeClassName="active" // Optional, if you want to style active link
          >
            <Sidebar.Item as="div" key={category.MaLoai}>
            {category.TenLoai}
            </Sidebar.Item>
          </NavLink>       
      ))}
    </Sidebar.ItemGroup>
  </Sidebar.Items>
</Sidebar>
  )
}

export default SidebarCatagory