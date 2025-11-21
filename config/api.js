const API = {
  AUTH: {
    // simple 登录与资料接口（users/urls_simple.py）
    LOGIN: '/api/v1/auth/login/',
    PROFILE: '/api/v1/auth/profile/',
    REGISTER: '/api/v1/auth/register/'
  },
  PRODUCTS: {
    LIST: '/api/v1/products/',
    DETAIL: (id) => `/api/v1/products/${id}/`,
    CATEGORIES: '/api/v1/products/categories/'
  },
  // 购物车独立路由（后端已在 /api/v1/cart/ 暴露）
  CART: {
    LIST: '/api/v1/cart/cart/',
    ADD_ITEM: '/api/v1/cart/cart/create/',
    UPDATE_ITEM: (id) => `/api/v1/cart/cart/${id}/update/`,
    DELETE_ITEM: (id) => `/api/v1/cart/cart/${id}/delete/`
  },
  ORDERS: {
    LIST: '/api/v1/orders/',
    DETAIL: (id) => `/api/v1/orders/${id}/`,
    CREATE: '/api/v1/orders/create/',
    DELETE: (id) => `/api/v1/orders/${id}/delete/`
  },
  ADDRESS: {
    LIST: '/api/v1/addresses/',
    DETAIL: (id) => `/api/v1/addresses/${id}/`,
    CREATE: '/api/v1/addresses/',
    UPDATE: (id) => `/api/v1/addresses/${id}/`,
    DELETE: (id) => `/api/v1/addresses/${id}/`
  }
};
module.exports = API;


