const { request } = require('../utils/request');
const API = require('../config/api');

module.exports = {
  async create(orderData){ 
    console.log('orderService.create 接收到的数据:', orderData);
    
    // 如果没有指定地址ID，使用默认地址ID
    let addressId = orderData.address_id;
    if (!addressId) {
      // 暂时使用固定地址ID，避免获取地址列表的复杂性
      addressId = 1;
      console.log('使用默认地址ID:', addressId);
    }
    
    // 确保address_id是数字类型
    addressId = parseInt(addressId);
    
    // 处理items数组 - 支持单个商品和多个商品
    let items = [];
    if (orderData.items && Array.isArray(orderData.items)) {
      // 购物车结算模式 - 使用传入的items数组
      items = orderData.items.map(item => {
        console.log('处理订单商品项:', item);
        const productId = parseInt(item.product_id);
        const quantity = parseInt(item.quantity);
        
        if (isNaN(productId) || isNaN(quantity)) {
          console.error('商品数据无效:', item);
          throw new Error('商品数据无效');
        }
        
        return {
          product_id: productId,
          quantity: quantity
        };
      });
    } else if (orderData.product_id && orderData.quantity) {
      // 单个商品模式 - 兼容旧代码
      items = [{
        product_id: parseInt(orderData.product_id),
        quantity: parseInt(orderData.quantity)
      }];
    } else {
      throw new Error('订单数据格式错误');
    }
    
    // 转换数据格式以匹配后端API
    const data = {
      address_id: addressId,
      items: items,
      remark: orderData.remark || ''
    };
    
    console.log('提交订单数据:', data);
    console.log('数据类型检查:', {
      address_id: typeof data.address_id,
      items: typeof data.items,
      items_is_array: Array.isArray(data.items),
      items_length: data.items ? data.items.length : 0,
      product_id: data.items.length > 0 ? typeof data.items[0].product_id : 'undefined',
      quantity: data.items.length > 0 ? typeof data.items[0].quantity : 'undefined'
    });
    console.log('items详细内容:', JSON.stringify(data.items));
    
    return request({ url: API.ORDERS.CREATE, method:'POST', data }); 
  },
  list(){ return request({ url: API.ORDERS.LIST }); },
  detail(id){ return request({ url: API.ORDERS.DETAIL(id) }); },
  delete(id){ return request({ url: API.ORDERS.DELETE(id), method:'DELETE' }); }
}


