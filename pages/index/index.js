// index.js - 首页逻辑
const productService = require('../../services/product');
const { getProductMainImage, getCategoryIcon, getUserAvatar } = require('../../utils/image');
const env = require('../../config/env');

Page({
  data: {
    categories: [], // 商品分类数据
    featuredProducts: [], // 推荐商品数据（用于下方网格展示）
    bannerProducts: [], // 轮播图推荐商品数据（用于顶部轮播）
    bannerCurrent: 0, // 当前轮播图索引
    bannerAutoplay: true, // 轮播图是否自动播放
    loading: false,
    cartCount: 0, // 购物车数量
    searchKeyword: '', // 搜索关键词
    isLoggedIn: false, // 登录状态
    user: null, // 用户信息
    avatarUrl: '' // 首页左上角头像URL
  },
  
  // 轮播图自动滚动计时器
  bannerTimer: null,

  // 页面加载时获取数据
  async onLoad() {
    this.setData({ loading: true });
    // 设置banner图为可访问的完整URL（使用SVG格式，但需要处理HTTP问题）
    this.setData({ bannerUrl: `${env.baseURL}/static/assets/images/banner.svg` });
    
    // 检查登录状态
    this.checkLoginStatus();
    
    await Promise.all([
      this.loadCategories(),
      this.loadFeaturedProducts()
    ]);
    this.setData({ loading: false });
    
    // 启动轮播图自动滚动
    this.startBannerAutoPlay();
  },
  
  // 页面卸载时清理定时器
  onUnload() {
    this.stopBannerAutoPlay();
  },

  // 页面显示时刷新数据
  async onShow() {
    // 检查登录状态
    this.checkLoginStatus();
    
    await Promise.all([
      this.loadCategories(),
      this.loadFeaturedProducts()
    ]);
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const user = wx.getStorageSync('userInfo');
    
    if (token) {
      this.setData({
        isLoggedIn: true,
        user: user || null,
        cartCount: (user && user.cartCount) ? user.cartCount : 0,
        // 已登录时，如果有头像则使用用户头像，否则使用系统默认图标样式
        avatarUrl: (user && user.avatar_url) ? getUserAvatar(user.avatar_url) : ''
      });
    } else {
      this.setData({
        isLoggedIn: false,
        user: null,
        cartCount: 0,
        // 未登录时，使用系统默认图标样式（不传URL）
        avatarUrl: ''
      });
    }
  },

  // 加载商品分类数据
  async loadCategories() {
    try {
      const categories = await productService.getCategories();
      console.log('获取到的分类数据:', categories);
      
      // 处理分类数据，添加图标URL
      const categoriesWithIcons = categories.map(category => {
        return {
          ...category,
          icon_url: getCategoryIcon(category.icon) // 处理图标URL
        };
      });
      
      // 只取前4个分类
      const displayCategories = categoriesWithIcons.slice(0, 4);
      
      this.setData({ 
        categories: displayCategories
      });
    } catch (error) {
      console.error('加载分类失败:', error);
      wx.showToast({
        title: '加载分类失败',
        icon: 'none'
      });
    }
  },

  // 加载推荐商品数据
  async loadFeaturedProducts() {
    try {
      const products = await productService.list({ is_featured: true });
      console.log('获取到的推荐商品数据:', products);
      
      // 处理图片URL
      const processedProducts = products.map(product => {
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          category_name: product.category_name,
          is_featured: product.is_featured,
          mainImage: getProductMainImage(product)
        };
      });
      
      // 轮播图展示前5个推荐商品
      const bannerProducts = processedProducts.slice(0, 5);
      
      // 下方网格展示前8个推荐商品（如果数量足够）
      const displayProducts = processedProducts.slice(0, 8);
      
      this.setData({ 
        bannerProducts: bannerProducts, // 轮播图商品
        featuredProducts: displayProducts // 下方网格商品
      });
    } catch (error) {
      console.error('加载推荐商品失败:', error);
      wx.showToast({
        title: '加载推荐商品失败',
        icon: 'none'
      });
    }
  },

  // 跳转到商品列表页面
  goProductList() {
    wx.navigateTo({
      url: '/pages/product/list/list'
    });
  },

  // 跳转到“我的”页面（个人中心 Tab）
  goProfile() {
    wx.switchTab({
      url: '/pages/profile/profile'
    });
  },

  // 跳转到分类页面
  goCategory() {
    wx.switchTab({
      url: '/pages/category/category'
    });
  },

  // 点击分类项
  onCategoryTap(e) {
    const categoryId = e.currentTarget.dataset.id;
    const categoryName = e.currentTarget.dataset.name;
    
    console.log('点击分类:', categoryName, 'ID:', categoryId);
    
    // 使用全局数据存储分类信息
    getApp().globalData = getApp().globalData || {};
    getApp().globalData.selectedCategory = {
      id: categoryId,
      name: categoryName
    };
    
    // 跳转到分类页面
    wx.switchTab({
      url: '/pages/category/category'
    });
  },

  // 跳转到购物车
  goCart() {
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再查看购物车',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }
        }
      });
      return;
    }
    
    wx.switchTab({
      url: '/pages/cart/cart'
    });
  },

  // 轮播图切换事件（包括用户点击指示器或手动滑动）
  onBannerChange(e) {
    const current = e.detail.current;
    console.log('轮播图切换:', current);
    
    this.setData({
      bannerCurrent: current
    });
    
    // 小程序原生 swiper 的 autoplay 会在用户手动切换后自动重置计时器
    // 不需要额外处理，保持自动播放开启即可
  },
  
  // 轮播图触摸开始（用户开始滑动时，小程序会自动暂停 autoplay）
  onBannerTouchStart() {
    // 小程序原生 swiper 会在用户触摸时自动暂停 autoplay
    // 不需要手动处理
  },
  
  // 轮播图触摸结束（用户滑动结束后，小程序会自动恢复 autoplay 并重置计时器）
  onBannerTouchEnd() {
    // 小程序原生 swiper 会在用户触摸结束后自动恢复 autoplay
    // 并在当前项目上重新开始计时（3秒后自动切换）
    // 不需要手动处理
  },
  
  // 启动轮播图自动滚动
  startBannerAutoPlay() {
    // 如果轮播图商品数量为0，不启动自动滚动
    if (!this.data.bannerProducts || this.data.bannerProducts.length === 0) {
      return;
    }
    
    // 开启自动播放（小程序原生会处理点击指示器和滑动后的自动重置）
    this.setData({
      bannerAutoplay: true
    });
  },
  
  // 停止轮播图自动滚动
  stopBannerAutoPlay() {
    if (this.bannerTimer) {
      clearTimeout(this.bannerTimer);
      this.bannerTimer = null;
    }
    this.setData({
      bannerAutoplay: false
    });
  },
  
  // 跳转到商品详情页面
  goProductDetail(e) {
    const productId = e.currentTarget.dataset.id;
    console.log('点击商品详情，ID:', productId);
    
    if (productId) {
      wx.navigateTo({
        url: `/pages/product/detail/detail?id=${productId}`
      });
    } else {
      wx.showToast({
        title: '商品信息错误',
        icon: 'none'
      });
    }
  },

  // 跳转到更多推荐商品页面
  goFeaturedProducts() {
    console.log('跳转到更多推荐商品页面');
    
    // 使用全局数据存储推荐商品筛选信息
    getApp().globalData = getApp().globalData || {};
    getApp().globalData.featuredFilter = true;
    
    // 跳转到分类页面显示所有推荐商品
    wx.switchTab({
      url: '/pages/category/category'
    });
  },

  // 搜索输入处理
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 搜索确认处理
  onSearchConfirm(e) {
    const keyword = e.detail.value.trim();
    if (!keyword) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }

    console.log('搜索关键词:', keyword);
    
    // 使用全局数据存储搜索信息
    getApp().globalData = getApp().globalData || {};
    getApp().globalData.searchKeyword = keyword;
    
    // 跳转到分类页面显示搜索结果
    wx.switchTab({
      url: '/pages/category/category'
    });
  }
});
