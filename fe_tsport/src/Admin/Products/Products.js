import React, { useEffect, useState } from 'react';
import { fetchData } from '../API/handleCRUD';

import { CiCirclePlus } from "react-icons/ci";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaRegEdit } from "react-icons/fa";

function ProductsAd() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [addingProduct, setAddingProduct] = useState(null);
  const [addMode, setAddMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null)
  const baseURL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const getProducts = async () => {
      try {
        const data = await fetchData('data/products', 'products');
        setProducts(data || []);
      } catch (error) {
        console.error(error);
      }
    };

    const getCategories = async () => {
      try {
        const data = await fetchData('data/categories', 'categories');
        setCategories(data || []);
      } catch (error) {
        console.error(error);
      }
    };
    getProducts();
    getCategories();
  }, []);

  const handleAdd = () => {
    setAddingProduct({
      TenSanPham: '',
      MoTa: '',
      GiaBan: 0,
      SoLuong: 0,
      ThuongHieu: '',
      MaLoaiSanPham: '',
      MaNhaSanXuat: ''
    });
    setAddMode(true);
  };

  const [files, setFiles] = useState({
    HinhAnhChinh: null,
    AnhChiTiet01: null,
    AnhChiTiet02: null,
    AnhChiTiet03: null,
    AnhChiTiet04: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddingProduct({
      ...addingProduct,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFiles((prevFiles) => ({
      ...prevFiles,
      [name]: files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('MaLoai', addingProduct.MaLoai);
    data.append('TenSanPham', addingProduct.TenSanPham);
    data.append('MoTa', addingProduct.MoTa);
    data.append('GiaBan', addingProduct.GiaBan);
    data.append('SoLuong', addingProduct.SoLuong);
    data.append('ThuongHieu', addingProduct.ThuongHieu);

    Object.keys(files).forEach((key) => {
      if (files[key]) {
        data.append(key, files[key]);
      }
    });

    try {
      const response = await fetch(`${baseURL}/data/create/products`, { //http://localhost:3001/data/create/products
        method: 'POST',
        body: data
      });
      if (!response.ok) {
        throw new Error('Lỗi: ' + response.statusText);
      }

      const result = await response.json();
      console.log('Thêm sản phẩm thành công: ', result);

      // Fetch lại danh sách sản phẩm sau khi thêm sản phẩm mới
      const updatedProducts = await fetchData('data/products', 'products');
      setProducts(updatedProducts || []);

      // Reset form và thoát chế độ thêm sản phẩm
      setAddingProduct(null);
      setAddMode(false);
    } catch (error) {
      console.error('Lỗi thêm sản phẩm: ', error);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product)
    setAddMode(true)
    setAddingProduct(product)
  }

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setAddMode(false);
    setAddingProduct({
      TenSanPham: '',
      MoTa: '',
      GiaBan: 0,
      SoLuong: 0,
      ThuongHieu: '',
      MaLoaiSanPham: '',
      MaNhaSanXuat: ''
    });
    setFiles({
      HinhAnhChinh: null,
      AnhChiTiet01: null,
      AnhChiTiet02: null,
      AnhChiTiet03: null,
      AnhChiTiet04: null
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('MaLoai', addingProduct.MaLoai);
    data.append('TenSanPham', addingProduct.TenSanPham);
    data.append('MoTa', addingProduct.MoTa);
    data.append('GiaBan', addingProduct.GiaBan);
    data.append('SoLuong', addingProduct.SoLuong);
    data.append('ThuongHieu', addingProduct.ThuongHieu);

    Object.keys(files).forEach((key) => {
      if (files[key]) {
        data.append(key, files[key]);
      }
    });

    try {
      const response = await fetch(`${baseURL}/data/update/products/${editingProduct.MaSanPham}`, { //http://localhost:3001/data/update/products/${editingProduct.MaSanPham}
        method: 'PUT',
        body: data
      });
      if (!response.ok) {
        throw new Error('Lỗi mạng không ổn định' + response.statusText);
      }

      const result = await response.json();
      console.log('Cập nhật sản phẩm thành công: ', result);
      const updatedProducts = await fetchData('data/products', 'products');
      setProducts(updatedProducts || []);

      // Reset form và thoát chế độ chỉnh sửa sản phẩm
      setEditingProduct(null);
      setAddMode(false);
      setAddingProduct({
        TenSanPham: '',
        MoTa: '',
        GiaBan: 0,
        SoLuong: 0,
        ThuongHieu: '',
        MaLoaiSanPham: '',
        MaNhaSanXuat: ''
      });
      setFiles({
        HinhAnhChinh: null,
        AnhChiTiet01: null,
        AnhChiTiet02: null,
        AnhChiTiet03: null,
        AnhChiTiet04: null
      });
    } catch (error) {
      console.error('Lỗi cập nhật sản phẩm: ', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) {
      try {
        await fetch(`${baseURL}/data/delete/products/${id}`, { //http://localhost:3001/data/delete/products/${id}
          method: 'DELETE'
        });

        // Fetch lại danh sách sản phẩm sau khi xóa sản phẩm
        const updatedProducts = await fetchData('data/products', 'products');
        setProducts(updatedProducts || []);
      } catch (error) {
        console.error('Lỗi xóa sản phẩm: ', error);
      }
    }
  };

  return (
    <div className="container mx-auto mt-4">
      {addMode ? (
        <div className="bg-white shadow-md rounded-lg">
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">{editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h2>
          </div>
          <div className="p-4">
            <form onSubmit={editingProduct ? handleUpdate : handleSubmit}>
              <div className="mb-4">
                <label htmlFor="MaLoai" className="block text-sm font-medium text-gray-700">Loại sản phẩm</label>
                <select
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  id="MaLoai"
                  name="MaLoai"
                  value={addingProduct.MaLoai}
                  onChange={handleChange}
                >
                  <option value="">Chọn loại sản phẩm</option>
                  {categories.map((category) => (
                    <option key={category.MaLoai} value={category.MaLoai}>
                      {category.TenLoai}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="TenSanPham" className="block text-sm font-medium text-gray-700">Tên sản phẩm</label>
                <input
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  id="TenSanPham"
                  name="TenSanPham"
                  value={addingProduct.TenSanPham}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="MoTa" className="block text-sm font-medium text-gray-700">Mô tả</label>
                <textarea
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  id="MoTa"
                  name="MoTa"
                  value={addingProduct.MoTa}
                  onChange={handleChange}
                  rows="3"
                ></textarea>
              </div>
              <div className="mb-4">
                <label htmlFor="HinhAnhChinh" className="block text-sm font-medium text-gray-700">Hình ảnh chính</label>
                <input 
                  type="file" 
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200" 
                  id="HinhAnhChinh" 
                  name="HinhAnhChinh" 
                  onChange={handleFileChange} 
                />
              </div>
              <div className="mb-4">
                <label htmlFor="AnhChiTiet01" className="block text-sm font-medium text-gray-700">Ảnh chi tiết 1</label>
                <input 
                  type="file" 
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200" 
                  id="AnhChiTiet01" 
                  name="AnhChiTiet01" 
                  onChange={handleFileChange} 
                />
              </div>
              <div className="mb-4">
                <label htmlFor="AnhChiTiet02" className="block text-sm font-medium text-gray-700">Ảnh chi tiết 2</label>
                <input 
                  type="file" 
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200" 
                  id="AnhChiTiet02" 
                  name="AnhChiTiet02" 
                  onChange={handleFileChange} 
                />
              </div>
              <div className="mb-4">
                <label htmlFor="AnhChiTiet03" className="block text-sm font-medium text-gray-700">Ảnh chi tiết 3</label>
                <input 
                  type="file" 
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200" 
                  id="AnhChiTiet03" 
                  name="AnhChiTiet03" 
                  onChange={handleFileChange} 
                />
              </div>
              <div className="mb-4">
                <label htmlFor="AnhChiTiet04" className="block text-sm font-medium text-gray-700">Ảnh chi tiết 4</label>
                <input 
                  type="file" 
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200" 
                  id="AnhChiTiet04" 
                  name="AnhChiTiet04" 
                  onChange={handleFileChange} 
                />
              </div>

              <div className="mb-4">
                <label htmlFor="GiaBan" className="block text-sm font-medium text-gray-700">Giá bán</label>
                <input
                  type="number"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  id="GiaBan"
                  name="GiaBan"
                  value={addingProduct.GiaBan}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="SoLuong" className="block text-sm font-medium text-gray-700">Số lượng</label>
                <input
                  type="number"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  id="SoLuong"
                  name="SoLuong"
                  value={addingProduct.SoLuong}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="ThuongHieu" className="block text-sm font-medium text-gray-700">Thương hiệu</label>
                <input
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  id="ThuongHieu"
                  name="ThuongHieu"
                  value={addingProduct.ThuongHieu}
                  onChange={handleChange}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{editingProduct ? 'Cập nhật' : 'Thêm'}</button>
                <button type="button" className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600" onClick={handleCancelEdit}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg">
          <div className="border-b p-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Danh sách sản phẩm</h2>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" onClick={handleAdd}>
              <CiCirclePlus className="inline-block mr-1" /> Thêm sản phẩm
            </button>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên sản phẩm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ảnh chính</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá bán</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thương hiệu</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map(product => (
                    <tr key={product.MaSanPham}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.MaSanPham}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.TenSanPham}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.MoTa}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <img 
                          src={`${product.HinhAnhChinh}`} ///images/${product.HinhAnhChinh}
                          alt={product.TenSanPham} 
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.GiaBan}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.SoLuong}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.ThuongHieu}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right flex space-x-2">
                          <FaRegEdit 
                            className="text-blue-600 hover:text-blue-800 cursor-pointer" 
                            onClick={() => handleEdit(product)}
                            style={{ fontSize: '1.2rem' }}
                          />
                          <RiDeleteBin6Line 
                            className="text-red-600 hover:text-red-800 cursor-pointer" 
                            onClick={() => handleDelete(product.MaSanPham)}
                            style={{ fontSize: '1.2rem' }}
                          />
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
}

export default ProductsAd;
