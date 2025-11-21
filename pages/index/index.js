// index.js - 首页逻辑
const productService = require('../../services/product');
const { getProductMainImage, getCategoryIcon } = require('../../utils/image');
const env = require('../../config/env');

Page({
  data: {
    categories: [], // 商品分类数据
    featuredProducts: [], // 推荐商品数据
    loading: false,
    cartCount: 0, // 购物车数量
    searchKeyword: '', // 搜索关键词
    isLoggedIn: false, // 登录状态
    user: null // 用户信息
  },

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
        cartCount: (user && user.cartCount) ? user.cartCount : 0
      });
    } else {
      this.setData({
        isLoggedIn: false,
        user: null,
        cartCount: 0
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
      
      // 只取前8个推荐商品，并处理图片URL
      const displayProducts = products.slice(0, 8).map(product => {
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
      
      this.setData({ 
        featuredProducts: displayProducts
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
