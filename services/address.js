const { request } = require('../utils/request');
const API = require('../config/api');

// 确保数据格式正确的辅助函数
function sanitizeAddressData(data) {
  const sanitized = {};
  for (const key in data) {
    if (Array.isArray(data[key])) {
      // 对于数组，根据字段类型决定处理方式
      if (key === 'is_default') {
        sanitized[key] = Boolean(data[key][0]);
      } else {
        sanitized[key] = data[key].join('');
      }
    } else {
      // 对于非数组，根据字段类型决定处理方式
      if (key === 'is_default') {
        sanitized[key] = Boolean(data[key]);
      } else {
        sanitized[key] = String(data[key] || '');
      }
    }
  }
  return sanitized;
}

module.exports = {
  list(){ return request({ url: API.ADDRESS.LIST }); },
  detail(id){ return request({ url: API.ADDRESS.DETAIL(id) }); },
  create(data){ 
    console.log('addressService.create - 原始数据:', data);
    const sanitizedData = sanitizeAddressData(data);
    console.log('addressService.create - 清理后数据:', sanitizedData);
    console.log('addressService.create - street字段类型:', typeof sanitizedData.street, '值:', sanitizedData.street);
    return request({ url: API.ADDRESS.CREATE, method:'POST', data: sanitizedData }); 
  },
  update(id,data){ 
    console.log('addressService.update - 原始数据:', data);
    const sanitizedData = sanitizeAddressData(data);
    console.log('addressService.update - 清理后数据:', sanitizedData);
    return request({ url: API.ADDRESS.UPDATE(id), method:'PUT', data: sanitizedData }); 
  },
  remove(id){ return request({ url: API.ADDRESS.DELETE(id), method:'DELETE' }); }
}


