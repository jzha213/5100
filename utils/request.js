const env = require('../config/env');

function getToken(){
  try{ return wx.getStorageSync('token') || ''; }catch(e){ return '' }
}

function request({url, method='GET', data={}, header={}}){
  const baseURL = env.baseURL;

  
  // 检查是否为匿名访问的接口（不需要认证）
  const isAnonymousAllowed = 
    url.indexOf('/auth/login') > -1 ||      // 登录接口
    url.indexOf('/auth/register') > -1 ||   // 注册接口
    url === '/api/v1/products/' ||          // 产品列表（GET）
    url === '/api/v1/products/categories/' || // 分类列表（GET）
    (url.indexOf('/api/v1/products/') > -1 && method === 'GET'); // 产品详情（GET）
  
  // 如果不是匿名访问的接口，检查 token
  if (!isAnonymousAllowed) {
    const token = getToken();
    if (!token) {
      // 静默拒绝，返回一个标记为静默错误的 Promise
      // 使用一个特殊构造的错误对象，确保不会被显示
      const authError = {
        statusCode: 401,
        isAuthError: true,
        silent: true,
        data: { message: '' }, // 清空 message，避免被显示
        message: '', // 清空 message
        errMsg: '', // 清空 errMsg
        toString: function() { return ''; }, // 重写 toString，返回空字符串
        toJSON: function() { return {}; } // 重写 toJSON，返回空对象
      };
      // 静默返回，不显示错误，不输出日志
      return Promise.reject(authError);
    }
  }
  
  return new Promise((resolve,reject)=>{
    // 调试日志
    // eslint-disable-next-line no-console
    console.log('[request]', method, baseURL + url, data);
    
    // 特别检查street字段
    if (data && data.street !== undefined) {
      console.log('[request] street字段检查:', typeof data.street, '值:', data.street, '是否为数组:', Array.isArray(data.street));
    }
    
    // 特别检查is_default字段
    if (data && data.is_default !== undefined) {
      console.log('[request] is_default字段检查:', typeof data.is_default, '值:', data.is_default, '是否为数组:', Array.isArray(data.is_default));
    }
    
    // 特别检查items字段
    if (data && data.items !== undefined) {
      console.log('[request] items字段检查:', typeof data.items, '值:', data.items, '是否为数组:', Array.isArray(data.items));
    }
    
    // 简化数据清理逻辑，只处理特定字段
    let cleanData = data;
    
    // 只对特定字段进行清理，避免破坏订单数据
    if (data && typeof data === 'object') {
      cleanData = { ...data };
      
      // 处理is_default字段（地址相关）
      if (cleanData.is_default && Array.isArray(cleanData.is_default)) {
        cleanData.is_default = Boolean(cleanData.is_default[0]);
      }
      
      // 处理street字段（地址相关）
      if (cleanData.street && Array.isArray(cleanData.street)) {
        cleanData.street = cleanData.street.join('');
      }
      
      // 对于items字段，确保其内容正确
      if (cleanData.items && Array.isArray(cleanData.items)) {
        cleanData.items = cleanData.items.map(item => {
          if (typeof item === 'object' && item !== null) {
            return {
              product_id: parseInt(item.product_id),
              quantity: parseInt(item.quantity)
            };
          }
          return item;
        });
      }
    }
    
    console.log('[request] 清理后的数据:', cleanData);
    
    wx.request({
      url: baseURL + url,
      method,
      data: cleanData,
      header: {
        'Content-Type': 'application/json',
        // 登录接口不需要 Authorization
        'Authorization': (url.indexOf('/auth/login')>-1) ? '' : (getToken() ? `Bearer ${getToken()}` : ''),
        ...header
      },
      success(res){
        if(res.statusCode>=200 && res.statusCode<300){
          const data = res.data && res.data.data !== undefined ? res.data.data : res.data;
          resolve(data);
        }else{
          // 对于 401 未授权错误，静默处理
          if (res.statusCode === 401) {
            // 如果 token 已过期或无效，清除本地 token
            try {
              wx.removeStorageSync('token');
              wx.removeStorageSync('userInfo');
            } catch (e) {
              // 忽略清除错误
            }
            // 对于 401 错误，静默 reject，标记为认证错误和静默错误
            reject({
              statusCode: 401,
              data: res.data,
              isAuthError: true,
              silent: true // 标记为静默错误
            });
            return;
          }
          
          // eslint-disable-next-line no-console
          console.warn('[request-error]', res.statusCode, res.data);
          reject(res);
        }
      },
      fail(err){ 
        // 对于网络错误，如果是认证相关，也标记为静默
        if (err && (err.errMsg && err.errMsg.includes('auth') || err.errMsg && err.errMsg.includes('401'))) {
          reject({
            ...err,
            isAuthError: true,
            silent: true
          });
          return;
        }
        console.error('[request-fail]', err);
        reject(err); 
      }
    })
  })
}

module.exports = { request };


