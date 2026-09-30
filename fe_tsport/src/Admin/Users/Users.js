import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fetchData, editData, deleteData } from '../API/handleCRUD';

import { RiDeleteBin6Line } from "react-icons/ri";
import { FaRegEdit } from "react-icons/fa";

function ListOfCustomers() {
    const [customers, setCustomers] = useState([]);
    const [editingCustomers, setEditingCustomers] = useState(null);
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        const getCustomers = async () => {
            try {
                const data = await fetchData('data/users', 'users');
                setCustomers(data || []);
            } catch (error) {
                console.error(error);
            }
        };
        getCustomers();
    }, []);

    const handleEdit = (users) => {
        setEditingCustomers({
            ...JSON.parse(JSON.stringify(users)),
            NgaySinh: format(parseISO(users.NgaySinh), 'yyyy-MM-dd')
        });
        setEditMode(true);
    };

    const handleSave = async () => {
        try {
            const updatedCustomerData = {
                ...editingCustomers,
                NgaySinh: format(parseISO(editingCustomers.NgaySinh), 'yyyy-MM-dd')
            };

            await editData('data/update/users', editingCustomers.MaNguoiDung, updatedCustomerData);

            setCustomers(prevCustomers =>
                prevCustomers.map(c => c.MaNguoiDung === editingCustomers.MaNguoiDung ? updatedCustomerData : c)
            );

            setEditMode(false);
            setEditingCustomers(null);
        } catch (error) {
            console.log('Error updating user:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await deleteData('data/delete/users', id);
                setCustomers(prevCustomers => prevCustomers.filter(customer => customer.MaNguoiDung !== id));
            } catch (error) {
                console.log('Error deleting customer', error);
            }
        }
    };

    return (
        <div className="container mx-auto mt-8">
            {editMode ? (
                <div className="bg-white shadow-md rounded p-6">
                    <h2 className="text-xl font-semibold mb-4">Update User Information</h2>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <div className="mb-4">
                            <label htmlFor="tenNguoiDung" className="block font-medium">User Name:</label>
                            <input
                                type="text"
                                className="border border-gray-300 p-2 rounded w-full"
                                id="tenNguoiDung"
                                value={editingCustomers.TenNguoiDung}
                                onChange={(e) => setEditingCustomers({ ...editingCustomers, TenNguoiDung: e.target.value })}
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="email" className="block font-medium">Email:</label>
                            <input
                                type="email"
                                className="border border-gray-300 p-2 rounded w-full"
                                id="email"
                                value={editingCustomers.Email}
                                onChange={(e) => setEditingCustomers({ ...editingCustomers, Email: e.target.value })}
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="soDienThoai" className="block font-medium">Phone Number:</label>
                            <input
                                type="tel"
                                className="border border-gray-300 p-2 rounded w-full"
                                id="soDienThoai"
                                value={editingCustomers.SoDienThoai}
                                onChange={(e) => setEditingCustomers({ ...editingCustomers, SoDienThoai: e.target.value })}
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="ngaySinh" className="block font-medium">Date of Birth:</label>
                            <input
                                type="date"
                                className="border border-gray-300 p-2 rounded w-full"
                                id="ngaySinh"
                                value={editingCustomers.NgaySinh}
                                onChange={(e) => setEditingCustomers({ ...editingCustomers, NgaySinh: e.target.value })}
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="gioiTinh" className="block font-medium">Gender:</label>
                            <select
                                className="border border-gray-300 p-2 rounded w-full"
                                id="gioiTinh"
                                value={editingCustomers.GioiTinh}
                                onChange={(e) => setEditingCustomers({ ...editingCustomers, GioiTinh: e.target.value })}
                            >
                                <option value="">Select Gender</option>
                                <option value="Nam">Male</option>
                                <option value="Nữ">Female</option>
                                <option value="Khác">Other</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="diaChi" className="block font-medium">Address:</label>
                            <input
                                type="text"
                                className="border border-gray-300 p-2 rounded w-full"
                                id="diaChi"
                                value={editingCustomers.DiaChi}
                                onChange={(e) => setEditingCustomers({ ...editingCustomers, DiaChi: e.target.value })}
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="loaiNguoiDung" className="block font-medium">User Type:</label>
                            <input
                                type="text"
                                className="border border-gray-300 p-2 rounded w-full"
                                id="loaiNguoiDung"
                                value={editingCustomers.LoaiNguoiDung}
                                onChange={(e) => setEditingCustomers({ ...editingCustomers, LoaiNguoiDung: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end">
                            <button type="button" className="bg-blue-500 text-white px-4 py-2 rounded mr-2" onClick={handleSave}>Save</button>
                            <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={() => setEditMode(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="bg-white shadow-md rounded p-6">
                    <h2 className="text-xl font-semibold mb-4">Customer List</h2>
                    <table className="w-full border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border p-2">ID</th>
                                <th className="border p-2">User Name</th>
                                <th className="border p-2">Email</th>
                                <th className="border p-2">Phone</th>
                                <th className="border p-2">Date of Birth</th>
                                <th className="border p-2">Gender</th>
                                <th className="border p-2">Address</th>
                                <th className="border p-2">User Type</th>
                                <th className="border p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map(customer => (
                                <tr key={customer.MaNguoiDung}>
                                    <td className="border p-2">{customer.MaNguoiDung}</td>
                                    <td className="border p-2">{customer.TenNguoiDung}</td>
                                    <td className="border p-2">{customer.Email}</td>
                                    <td className="border p-2">{customer.SoDienThoai}</td>
                                    <td className="border p-2">{format(new Date(customer.NgaySinh), 'yyyy-MM-dd')}</td>
                                    <td className="border p-2">{customer.GioiTinh}</td>
                                    <td className="border p-2">{customer.DiaChi}</td>
                                    <td className="border p-2">{customer.LoaiNguoiDung}</td>
                                    <td className="border p-2 flex space-x-2">
                                        <FaRegEdit className="text-blue-500 cursor-pointer" onClick={() => handleEdit(customer)} />
                                        <RiDeleteBin6Line className="text-red-500 cursor-pointer" onClick={() => handleDelete(customer.MaNguoiDung)} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ListOfCustomers;
