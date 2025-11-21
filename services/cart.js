const { request } = require('../utils/request');
const API = require('../config/api');

module.exports = {
  // 获取购物车列表
  async list(){
    const res = await request({ url: API.CART.LIST });
    return res && res.data ? res.data : (res.results || res || []);
  },
  
  // 添加商品到购物车
  async addItem({ product_id, quantity, address_id, notes }){
    const data = {
      product: parseInt(product_id),
      quantity: parseInt(quantity),
      address: address_id ? parseInt(address_id) : null,
      notes: notes || ''
    };
    
    console.log('添加商品到购物车:', data);
    console.log('API URL:', API.CART.ADD_ITEM);
    return request({ 
      url: API.CART.ADD_ITEM, 
      method: 'POST', 
      data 
    });
  },
  
  // 更新购物车商品数量
  async updateItem(id, { quantity }){
    const data = {
      quantity: parseInt(quantity)
    };
    
    console.log('更新购物车商品:', { id, data });
    return request({ 
      url: API.CART.UPDATE_ITEM(id), 
      method: 'PUT', 
      data 
    });
  },
  
  // 删除购物车商品
  async deleteItem(id){
    console.log('删除购物车商品:', id);
    return request({ 
      url: API.CART.DELETE_ITEM(id), 
      method: 'DELETE' 
    });
  }
};
