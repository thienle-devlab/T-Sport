import React, { useEffect, useState } from 'react';
import { fetchData, editData, deleteData, createData } from '../API/handleCRUD';
import { CiCirclePlus } from "react-icons/ci";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaRegEdit } from "react-icons/fa";

function CategoryAd() {
    const [categories, setCategories] = useState([]);
    const [editingCategory, setEditingCategory] = useState(null);
    const [addingCategory, setAddingCategory] = useState({ TenLoai: '' });
    const [editMode, setEditMode] = useState(false);
    const [addMode, setAddMode] = useState(false);

    useEffect(() => {
        const getCategories = async () => {
            try {
                const data = await fetchData('data/categories', 'categories');
                setCategories(data || []);
            } catch (error) {
                console.error(error);
            }
        };
        getCategories();
    }, []);

    const handleAdd = async () => {
      try {
          await createData('data/create/categories', addingCategory);
          const updatedCategories = await fetchData('data/categories', 'categories');
          setCategories(updatedCategories || []);
          setAddMode(false);
          setAddingCategory({ TenLoai: '' });
      } catch (error) {
          console.error('Lỗi thêm loại sản phẩm: ', error);
      }
  }

    const handleEdit = (category) => {
        setEditingCategory({ ...JSON.parse(JSON.stringify(category)) });
        setEditMode(true);
    }

    const handleSave = async () => {
        try {
            const updatedCategoryData = { ...editingCategory };
            await editData('data/update/categories', editingCategory.MaLoai, updatedCategoryData);

            setCategories(prevCategories =>
                prevCategories.map(c => c.MaLoai === editingCategory.MaLoai ? updatedCategoryData : c)
            );

            setEditMode(false);
            setEditingCategory(null);
        } catch (error) {
            console.log('Lỗi cập nhật loại sản phẩm:', error);
        }
    }

    const handleDelete = async (id) => {
      if (window.confirm('Bạn có chắc chắn muốn xóa loại sản phẩm này không?')) {
        try {
          await deleteData('data/delete/categories', id);
          setCategories(prevCategories => prevCategories.filter(category => category.MaLoai !== id));
        } catch (error) {
          console.error('Lỗi xóa loại sản phẩm:', error);
          alert(`Có lỗi xảy ra khi xóa loại sản phẩm: ${error.message}`);
        }
      }
    };

    return (
        <div className="container mx-auto mt-8">
            {editMode ? (
                <div className="bg-white shadow-lg rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4">Cập nhật thông tin loại sản phẩm</h2>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <div className="mb-4">
                            <label htmlFor="editTenLoai" className="block text-gray-700 font-semibold mb-2">Tên Loại:</label>
                            <input
                                type='text'
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                id="editTenLoai"
                                value={editingCategory.TenLoai}
                                onChange={(e) => setEditingCategory({ ...editingCategory, TenLoai: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type='button' className="px-4 py-2 bg-blue-600 text-white rounded-lg" onClick={handleSave}>Lưu</button>
                            <button type='button' className="px-4 py-2 bg-gray-500 text-white rounded-lg" onClick={() => setEditMode(false)}>Hủy</button>
                        </div>
                    </form>
                </div>
            ) : addMode ? (
                <div className="bg-white shadow-lg rounded-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4">Thêm mới loại sản phẩm</h2>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <div className="mb-4">
                            <label htmlFor="addTenLoai" className="block text-gray-700 font-semibold mb-2">Tên Loại:</label>
                            <input
                                type='text'
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                id="addTenLoai"
                                value={addingCategory.TenLoai}
                                onChange={(e) => setAddingCategory({ ...addingCategory, TenLoai: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type='button' className="px-4 py-2 bg-green-600 text-white rounded-lg" onClick={handleAdd}>Thêm</button>
                            <button type='button' className="px-4 py-2 bg-gray-500 text-white rounded-lg" onClick={() => setAddMode(false)}>Hủy</button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="bg-white shadow-lg rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold">Danh sách loại sản phẩm</h2>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center" onClick={() => setAddMode(true)}>
                            <CiCirclePlus className="mr-1" /> Thêm loại sản phẩm
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="px-4 py-2">Mã Loại</th>
                                    <th className="px-4 py-2">Tên Loại</th>
                                    <th className="px-4 py-2">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map(category => (
                                    <tr key={category.MaLoai} className="hover:bg-gray-100">
                                        <td className="px-4 py-2">{category.MaLoai}</td>
                                        <td className="px-4 py-2">{category.TenLoai}</td>
                                        <td className="px-4 py-2 flex gap-2">
                                            <FaRegEdit 
                                                className="text-blue-600 cursor-pointer hover:text-blue-800"
                                                onClick={() => handleEdit(category)}
                                                style={{ fontSize: '1.2rem' }}
                                            />
                                            <RiDeleteBin6Line 
                                                className="text-red-600 cursor-pointer hover:text-red-800"
                                                onClick={() => handleDelete(category.MaLoai)}
                                                style={{ fontSize: '1.2rem' }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CategoryAd;
