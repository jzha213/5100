const { request } = require('../utils/request');
const API = require('../config/api');

module.exports = {
  async list(params={}){
    const res = await request({ url: API.PRODUCTS.LIST, data: params });
    // 后端返回 {success, data: [...]}，做兼容
    return res && res.data ? res.data : (res.results || res || []);
  },
  async detail(id){
    const res = await request({ url: API.PRODUCTS.DETAIL(id) });
    return res && res.data ? res.data : res;
  },
  async getCategories(){
    const res = await request({ url: API.PRODUCTS.CATEGORIES });
    return res && res.data ? res.data : (res.results || res || []);
  }
}


