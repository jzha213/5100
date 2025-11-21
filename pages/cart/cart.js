// pages/cart/cart.js
const cartService = require('../../services/cart');
const { getProductMainImage, processImageUrl } = require('../../utils/image');

Page({
  data: {
    cartItems: [],
    loading: false,
    allSelected: false,
    selectedCount: 0,
    totalPrice: 0,
    isLoggedIn: false, // 登录状态
    user: null // 用户信息
  },

  onLoad() {
    this.checkLoginStatus();
    // 直接检查 token，而不是依赖异步的 setData 更新
    const token = wx.getStorageSync('token');
    if (token) {
      this.loadCartItems();
    }
  },

  onShow() {
    this.checkLoginStatus();
    // 直接检查 token，而不是依赖异步的 setData 更新
    const token = wx.getStorageSync('token');
    if (token) {
      this.loadCartItems();
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const user = wx.getStorageSync('userInfo');
    
    if (token) {
      this.setData({
        isLoggedIn: true,
        user: user || null
      });
    } else {
      this.setData({
        isLoggedIn: false,
        user: null
      });
    }
  },

  // 访客模式 - 跳转到登录页面
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 访客模式 - 跳转到注册页面
  goToRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    });
  },

  // 加载购物车商品
  async loadCartItems() {
    // 再次检查 token（防止在调用过程中 token 被清除）
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ 
        loading: false,
        cartItems: [],
        isLoggedIn: false,
        user: null
      });
      return;
    }
    
    this.setData({ loading: true });
    try {
      const items = await cartService.list();
      console.log('购物车商品原始数据:', items);
      console.log('购物车商品数量:', items.length);
      
      // 检查原始数据的完整性
      items.forEach((item, index) => {
        console.log(`商品${index + 1}原始数据:`, {
          id: item.id,
          product: item.product,
          product_name: item.product_name,
          product_price: item.product_price,
          quantity: item.quantity,
          product_type: typeof item.product,
          quantity_type: typeof item.quantity
        });
        
        if (!item.product || item.product === null) {
          console.error(`商品${index + 1}的product字段为空:`, item);
        }
        
        if (!item.quantity || item.quantity === null) {
          console.error(`商品${index + 1}的quantity字段为空:`, item);
        }
      });
      
      // 处理购物车商品数据，构建完整的商品对象
      const processedItems = items.map(item => {
        console.log('处理购物车商品项:', item);
        
        // 从后端返回的数据中构建完整的商品对象
        const product = {
          id: item.product_id || item.product, // 优先使用product_id，回退到product
          name: item.product_name,
          price: parseFloat(item.product_price),
          sku: item.product_sku || '',
          mainImage: item.product_image ? processImageUrl(item.product_image) : null
        };
        
        console.log('原始商品数据:', {
          product_id: item.product_id,
          product: item.product,
          product_name: item.product_name,
          product_price: item.product_price,
          quantity: item.quantity
        });
        
        // 验证关键字段
        if (!product.id || product.id === null || product.id === undefined) {
          console.error('商品ID缺失或无效:', item);
          console.error('原始商品数据:', {
            product: item.product,
            product_name: item.product_name,
            product_price: item.product_price
          });
          return null;
        }
        
        if (!item.quantity || item.quantity <= 0) {
          console.error('商品数量无效:', item);
          return null;
        }
        
        console.log('构建的商品对象:', product);
        
        return {
          ...item,
          product: product,
          selected: true // 默认选中，这样用户能看到总价
        };
      }).filter(item => item !== null); // 过滤掉无效数据
      
      console.log('处理后的购物车商品:', processedItems);
      
      // 计算全选状态
      const allSelected = processedItems.length > 0 && processedItems.every(item => item.selected);
      
      this.setData({ 
        cartItems: processedItems,
        loading: false,
        allSelected: allSelected
      });
    } catch (error) {
      console.error('加载购物车失败:', error);
      
      // 如果是认证错误，静默处理
      if (error.statusCode === 401 || (error.data && error.data.message && (error.data.message.includes('需要重新登录') || error.data.message.includes('access_token')))) {
        // 清除过期的 token
        wx.removeStorageSync('token');
        wx.removeStorageSync('userInfo');
        this.setData({
          isLoggedIn: false,
          user: null
        });
      }
      
      this.setData({ 
        loading: false,
        cartItems: []
      });
      
      // 只有非认证错误才显示提示
      if (error.statusCode !== 401) {
        wx.showToast({
          title: '加载购物车失败',
          icon: 'none'
        });
      }
      
      this.calculateTotal();
    }
  },

  // 切换商品选中状态
  toggleItem(e) {
    const id = e.currentTarget.dataset.id;
    const items = this.data.cartItems.map(item => {
      if (item.id === id) {
        return { ...item, selected: !item.selected };
      }
      return item;
    });
    
    this.setData({ cartItems: items });
    this.calculateTotal();
  },

  // 全选/取消全选
  toggleAll() {
    const allSelected = !this.data.allSelected;
    const items = this.data.cartItems.map(item => ({
      ...item,
      selected: allSelected
    }));
    
    this.setData({ 
      cartItems: items,
      allSelected: allSelected
    });
    this.calculateTotal();
  },

  // 计算总价和选中数量
  calculateTotal() {
    const selectedItems = this.data.cartItems.filter(item => item.selected);
    console.log('计算总价 - 选中的商品:', selectedItems);
    
    const totalPrice = selectedItems.reduce((sum, item) => {
      const itemTotal = item.product.price * item.quantity;
      console.log(`商品 ${item.product.name}: 价格=${item.product.price}, 数量=${item.quantity}, 小计=${itemTotal}`);
      return sum + itemTotal;
    }, 0);
    
    const selectedCount = selectedItems.length;
    const allSelected = this.data.cartItems.length > 0 && selectedCount === this.data.cartItems.length;
    
    console.log('计算总价 - 总价:', totalPrice, '选中数量:', selectedCount);
    
    this.setData({
      totalPrice: totalPrice.toFixed(2),
      selectedCount: selectedCount,
      allSelected: allSelected
    });
  },

  // 减少数量
  decreaseQuantity(e) {
    const id = e.currentTarget.dataset.id;
    const items = this.data.cartItems.map(item => {
      if (item.id === id && item.quantity > 1) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    });
    
    this.setData({ cartItems: items });
    this.updateCartItem(id, items.find(item => item.id === id).quantity);
  },

  // 增加数量
  increaseQuantity(e) {
    const id = e.currentTarget.dataset.id;
    const items = this.data.cartItems.map(item => {
      if (item.id === id) {
        return { ...item, quantity: item.quantity + 1 };
      }
      return item;
    });
    
    this.setData({ cartItems: items });
    this.updateCartItem(id, items.find(item => item.id === id).quantity);
  },

  // 数量输入变化
  onQuantityChange(e) {
    const id = e.currentTarget.dataset.id;
    const quantity = parseInt(e.detail.value) || 1;
    
    const items = this.data.cartItems.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, quantity) };
      }
      return item;
    });
    
    this.setData({ cartItems: items });
    this.updateCartItem(id, items.find(item => item.id === id).quantity);
  },

  // 更新购物车商品
  async updateCartItem(id, quantity) {
    try {
      await cartService.updateItem(id, { quantity });
      this.calculateTotal();
    } catch (error) {
      console.error('更新购物车失败:', error);
      wx.showToast({
        title: '更新失败',
        icon: 'none'
      });
    }
  },

  // 删除商品
  deleteItem(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.cartItems.find(item => item.id === id);
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${item.product.name}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await cartService.deleteItem(id);
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            this.loadCartItems();
          } catch (error) {
            console.error('删除失败:', error);
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 去购物
  goShopping() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  // 结算
  checkout() {
    const selectedItems = this.data.cartItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      wx.showToast({
        title: '请选择要结算的商品',
        icon: 'none'
      });
      return;
    }
    
    try {
      // 将选中的商品信息存储到全局数据中
      const app = getApp();
      if (!app.globalData) {
        app.globalData = {};
      }
      
      app.globalData.checkoutItems = selectedItems.map(item => {
        console.log('--- 开始处理购物车商品 (cart.js) ---');
        console.log('完整购物车项:', item);
        console.log('商品信息 (cart.js):', item.product);
        console.log('数量 (cart.js):', item.quantity);
        console.log('商品ID (cart.js):', item.product ? item.product.id : 'undefined');
        console.log('商品ID类型 (cart.js):', typeof (item.product ? item.product.id : 'undefined'));
        console.log('数量类型 (cart.js):', typeof item.quantity);
        
        // 防御性检查，确保数据完整性
        if (!item.product) {
          console.error('商品信息缺失 (cart.js):', item);
          return null;
        }
        
        // 确保 product.id 是有效的数字
        const productId = parseInt(item.product.id);
        if (isNaN(productId) || productId <= 0) {
          console.error('商品ID缺失或无效 (cart.js):', item.product.id, '原始item:', item);
          return null;
        }
        
        // 确保 quantity 是有效的正数
        const quantity = parseInt(item.quantity);
        if (isNaN(quantity) || quantity <= 0) {
          console.error('商品数量无效 (cart.js):', item.quantity, '原始item:', item);
          return null;
        }
        
        const checkoutItem = {
          id: item.id,
          product_id: productId, // Use parsed ID
          product_name: item.product.name,
          product_price: item.product.price,
          product_image: item.product.mainImage,
          product_sku: item.product.sku,
          quantity: quantity, // Use parsed quantity
          subtotal: item.product.price * quantity,
          address_id: item.address_info ? item.address_info.id : null,
          address_info: item.address_info,
          notes: item.notes || ''
        };
        
        console.log('构建的结算商品 (cart.js):', checkoutItem);
        return checkoutItem;
      }).filter(item => item !== null); // 过滤掉无效数据
      
      console.log('购物车结算商品 (cart.js - globalData):', app.globalData.checkoutItems);
      
      if (app.globalData.checkoutItems.length === 0) {
        wx.showToast({
          title: '没有有效的结算商品',
          icon: 'none'
        });
        return;
      }
      
      // 跳转到订单确认页面
      wx.navigateTo({
        url: '/pages/order/confirm/confirm?mode=checkout'
      });
    } catch (error) {
      console.error('结算失败:', error);
      wx.showToast({
        title: '结算失败，请重试',
        icon: 'none'
      });
    }
  }
});