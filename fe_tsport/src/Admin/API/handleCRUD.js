// Đọc dữ liệu
const baseURL = process.env.REACT_APP_API_BASE_URL;

export const fetchData = async (endpoint, dataField = null) => {
    try {
        const response = await fetch(`${baseURL}/${endpoint}`); //http://localhost:3001/${endpoint}
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Nếu dataField được chỉ định, trả về dữ liệu từ trường đó
        // Nếu không, trả về toàn bộ dữ liệu
        return dataField ? data[dataField] : data;
    } catch(error) {
        console.error("Lỗi lấy dữ liệu: ", error);
        throw error;
    }
};

// Thêm dữ liệu
export const createData = async(endpoint, data) => {
    try {
        const response = await fetch(`${baseURL}/${endpoint}`, { //http://localhost:3001/${endpoint}
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch(error) {
        console.log('Lỗi thêm dữ liệu:', error);
        throw error;
    }
};
// Sửa dữ liệu
export const editData = async(endpoint, id, data) => {
    try {
        const response = await fetch(`${baseURL}/${endpoint}/${id}`, { //http://localhost:3001/${endpoint}/${id}
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch(error) {
        console.log('Lỗi cập nhật dữ liệu: ', error);
        throw error;
    }
};

// Xóa dữ liệu
export const deleteData = async(endpoint, id) => {
    try {
        const response = await fetch(`${baseURL}/${endpoint}/${id}`, { //http://localhost:3001/${endpoint}/${id}
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch(error) {
        console.error('Lỗi xóa dữ liệu:', error);
        throw error;
    }
};