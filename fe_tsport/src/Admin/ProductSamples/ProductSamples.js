import { useEffect, useState } from 'react';
import { fetchData, editData, deleteData, createData } from '../API/handleCRUD';
import { CiCirclePlus } from 'react-icons/ci';
import { FaRegEdit } from 'react-icons/fa';
import { RiDeleteBin6Line } from 'react-icons/ri';

function ProductSamplesAd() {
    const [productSample, setProductSample] = useState([]);
    const [products, setProducts] = useState([]);
    const [editingProductSample, setEditingProductSample] = useState(null);
    const [addingProductSample, setAddingProductSample] = useState({ MaSanPham: '', KichThuoc: '', MauSac: '', KieuDang: '' });
    const [editMode, setEditMode] = useState(false);
    const [addMode, setAddMode] = useState(false);

    useEffect(() => {
        const getProductSample = async () => {
            try {
                const data = await fetchData('data/productsample', 'productsample');
                setProductSample(data || []);
            } catch (error) {
                console.error(error);
            }
        };

        const getProducts = async () => {
            try {
                const data = await fetchData('data/products', 'products');
                setProducts(data || []);
            } catch (error) {
                console.error(error);
            }
        };

        getProductSample();
        getProducts();
    }, []);

    const handleAdd = async () => {
        try {
            await createData('data/create/productsample', addingProductSample);
            const updatedProductSample = await fetchData('data/productsample', 'productsample');
            setProductSample(updatedProductSample || []);
            setAddMode(false);
            setAddingProductSample({ MaSanPham: '', KichThuoc: '', MauSac: '', KieuDang: '' });
        } catch (error) {
            console.error('Lỗi thêm mẫu sản phẩm: ', error);
        }
    }

    const handleEdit = (productsample) => {
        setEditingProductSample({ ...JSON.parse(JSON.stringify(productsample)) });
        setEditMode(true);
    }

    const handleSave = async () => {
        try {
            const updatedProductSampleData = { ...editingProductSample };
            await editData('data/update/productsample', editingProductSample.MaMau, updatedProductSampleData);

            setProductSample(prevProductSample =>
                prevProductSample.map(productsample => productsample.MaMau === editingProductSample.MaMau ? updatedProductSampleData : productsample)
            );

            setEditMode(false);
            setEditingProductSample(null);
        } catch (error) {
            console.log('Lỗi cập nhật mẫu sản phẩm:', error);
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa mẫu sản phẩm này không?')) {
            try {
                await deleteData('data/delete/productsample', id);
                setProductSample(prevProductSample => prevProductSample.filter(productsample => productsample.MaMau !== id));
            } catch (error) {
                console.log('Lỗi xóa mẫu sản phẩm', error);
            }
        }
    }

    return (
        <div className="container mx-auto mt-4 px-4">
          {editMode ? (
            <div className="bg-white shadow-md rounded-lg mb-4">
              <div className="border-b p-4">
                <h2 className="text-lg font-semibold">Cập nhật thông tin mẫu sản phẩm</h2>
              </div>
              <div className="p-4">
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="mb-4">
                    <label htmlFor="SanPham" className="block text-sm font-medium text-gray-700">Sản phẩm</label>
                    <select
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      id="SanPham"
                      name="SanPham"
                      value={editingProductSample.MaSanPham}
                      onChange={(e) => setEditingProductSample({ ...editingProductSample, MaSanPham: e.target.value })}
                    >
                      <option value="">Chọn sản phẩm</option>
                      {products.map((product) => (
                        <option key={product.MaSanPham} value={product.MaSanPham}>
                          {product.TenSanPham}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="editKichThuoc" className="block text-sm font-medium text-gray-700">Kích thước:</label>
                    <input
                      type='text'
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      id="editKichThuoc"
                      value={editingProductSample.KichThuoc}
                      onChange={(e) => setEditingProductSample({ ...editingProductSample, KichThuoc: e.target.value })}
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="editMauSac" className="block text-sm font-medium text-gray-700">Màu sắc:</label>
                    <input
                      type='text'
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      id="editMauSac"
                      value={editingProductSample.MauSac}
                      onChange={(e) => setEditingProductSample({ ...editingProductSample, MauSac: e.target.value })}
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="editKieuDang" className="block text-sm font-medium text-gray-700">Kiểu dáng:</label>
                    <input
                      type='text'
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      id="editKieuDang"
                      value={editingProductSample.KieuDang}
                      onChange={(e) => setEditingProductSample({ ...editingProductSample, KieuDang: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button type='button' className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" onClick={handleSave}>Lưu</button>
                    <button type='button' className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600" onClick={() => setEditMode(false)}>Hủy</button>
                  </div>
                </form>
              </div>
            </div>
          ) : addMode ? (
            <div className="bg-white shadow-md rounded-lg mb-4">
              <div className="border-b p-4">
                <h2 className="text-lg font-semibold">Thêm mới mẫu sản phẩm</h2>
              </div>
              <div className="p-4">
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="mb-4">
                    <label htmlFor="MaSanPham" className="block text-sm font-medium text-gray-700">Sản phẩm</label>
                    <select
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      id="MaSanPham"
                      name="MaSanPham"
                      value={addingProductSample.MaSanPham}
                      onChange={(e) => setAddingProductSample({ ...addingProductSample, MaSanPham: e.target.value })}
                    >
                      <option value="">Chọn sản phẩm</option>
                      {products.map((product) => (
                        <option key={product.MaSanPham} value={product.MaSanPham}>
                          {product.TenSanPham}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="addKichThuoc" className="block text-sm font-medium text-gray-700">Kích thước:</label>
                    <input
                      type='text'
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      id="addKichThuoc"
                      value={addingProductSample.KichThuoc}
                      onChange={(e) => setAddingProductSample({ ...addingProductSample, KichThuoc: e.target.value })}
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="addMauSac" className="block text-sm font-medium text-gray-700">Màu sắc:</label>
                    <input
                      type='text'
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      id="addMauSac"
                      value={addingProductSample.MauSac}
                      onChange={(e) => setAddingProductSample({ ...addingProductSample, MauSac: e.target.value })}
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="addKieuDang" className="block text-sm font-medium text-gray-700">Kiểu dáng:</label>
                    <input
                      type='text'
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      id="addKieuDang"
                      value={addingProductSample.KieuDang}
                      onChange={(e) => setAddingProductSample({ ...addingProductSample, KieuDang: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button type='button' className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" onClick={handleAdd}>Thêm</button>
                    <button type='button' className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600" onClick={() => setAddMode(false)}>Hủy</button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}
    
          {!editMode && !addMode && (
            <div className="bg-white shadow-md rounded-lg">
              <div className="border-b p-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Danh sách mẫu sản phẩm</h2>
                <button onClick={() => setAddMode(true)} className="text-blue-600 hover:text-blue-800 flex items-center">
                  <CiCirclePlus className="mr-1" /> Thêm mới
                </button>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kích thước</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Màu sắc</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kiểu dáng</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productSample.map((sample) => (
                      <tr key={sample.MaMauSanPham}>
                        <td className="px-6 py-4 whitespace-nowrap">{sample.MaSanPham}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{sample.KichThuoc}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{sample.MauSac}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{sample.KieuDang}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleEdit(sample)} className="text-indigo-600 hover:text-indigo-900 mr-2"><FaRegEdit /></button>
                          <button onClick={() => handleDelete(sample.MaMauSanPham)} className="text-red-600 hover:text-red-900"><RiDeleteBin6Line /></button>
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


export default ProductSamplesAd