const productService = require('../../../services/product');
const { getProductMainImage } = require('../../../utils/image');

Page({
  data:{ 
    id: null, 
    item: null,
    loading: false,
    isLoggedIn: false, // 登录状态
    user: null // 用户信息
  },
  
  onLoad(q){ 
    if(q.id){ 
      this.setData({ id: q.id }); 
      this.checkLoginStatus();
      this.load(); 
    } 
  },
  
  onShow() {
    this.checkLoginStatus();
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
  
  async load(){
    this.setData({ loading: true });
    try{ 
      const item = await productService.detail(this.data.id); 
      console.log('商品详情:', item);
      
      // 为商品添加主图URL
      const itemWithImage = {
        ...item,
        mainImage: getProductMainImage(item)
      };
      
      this.setData({ 
        item: itemWithImage,
        loading: false
      }); 
    }
    catch(e){ 
      console.error('加载商品失败:', e);
      this.setData({ 
        loading: false,
        item: null
      });
      wx.showToast({ title:'加载失败', icon:'none' }); 
    }
  },
  
  // 加入购物车
  addToCart(){ 
    if(!this.data.item) return; 
    wx.navigateTo({ 
      url:`/pages/order/confirm/confirm?pid=${this.data.item.id}&qty=1&mode=addToCart` 
    }); 
  },
  
  buyNow(){ 
    if(!this.data.item) return; 
    wx.navigateTo({ 
      url:`/pages/order/confirm/confirm?pid=${this.data.item.id}&qty=1&mode=confirmOrder` 
    }); 
  }
});

