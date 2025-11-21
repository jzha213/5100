const productService = require('../../services/product');
const { getProductMainImage } = require('../../utils/image');

Page({
  data: {
    categories: [],
    selectedCategoryIndex: 0,
    selectedCategoryName: '请选择分类',
    products: [],
    loading: false,
    isSearchMode: false, // 是否为搜索模式
    isFeaturedMode: false, // 是否为推荐商品模式
    searchKeyword: '', // 搜索关键词
    isLoggedIn: false, // 登录状态
    user: null // 用户信息
  },

  onLoad(options) {
    this.checkLoginStatus();
    this.loadCategories();
  },

  onShow() {
    this.checkLoginStatus();
    const app = getApp();
    
    // 检查是否有搜索关键词
    if (app.globalData && app.globalData.searchKeyword) {
      const searchKeyword = app.globalData.searchKeyword;
      console.log('从首页获取到搜索关键词:', searchKeyword);
      
      this.setData({
        isSearchMode: true,
        isFeaturedMode: false,
        searchKeyword: searchKeyword,
        selectedCategoryName: `搜索结果: "${searchKeyword}"`
      });
      
      // 清除全局数据，避免重复使用
      delete app.globalData.searchKeyword;
      
      // 执行搜索
      this.performSearch(searchKeyword);
    }
    // 检查是否有推荐商品筛选
    else if (app.globalData && app.globalData.featuredFilter) {
      console.log('显示推荐商品');
      
      this.setData({
        isSearchMode: false,
        isFeaturedMode: true,
        selectedCategoryName: '推荐商品'
      });
      
      // 清除全局数据，避免重复使用
      delete app.globalData.featuredFilter;
      
      // 加载推荐商品
      this.loadFeaturedProducts();
    }
    // 检查是否有选中的分类
    else if (app.globalData && app.globalData.selectedCategory) {
      const selectedCategory = app.globalData.selectedCategory;
      console.log('从首页获取到选中的分类:', selectedCategory);
      
      // 找到对应的分类索引
      const categoryIndex = this.data.categories.findIndex(cat => cat.id == selectedCategory.id);
      
      this.setData({
        isSearchMode: false,
        isFeaturedMode: false,
        selectedCategoryIndex: categoryIndex >= 0 ? categoryIndex : 0,
        selectedCategoryId: selectedCategory.id,
        selectedCategoryName: selectedCategory.name
      });
      
      // 清除全局数据，避免重复使用
      delete app.globalData.selectedCategory;
      
      // 加载对应分类的商品
      this.loadProducts(selectedCategory.id);
    } else {
      // 如果没有选中分类或搜索，加载所有商品
      this.setData({ 
        isSearchMode: false,
        isFeaturedMode: false
      });
      this.loadProducts();
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

  // 加载分类列表
  async loadCategories() {
    try {
      const categories = await productService.getCategories();
      console.log('分类数据:', categories);
      
      // 添加"全部"选项
      const allCategories = [{ id: 0, name: '全部商品' }, ...categories];
      
      this.setData({
        categories: allCategories,
        selectedCategoryName: allCategories[0].name
      });
    } catch (error) {
      console.error('加载分类失败:', error);
      wx.showToast({
        title: '加载分类失败',
        icon: 'none'
      });
    }
  },

  // 分类选择变化
  onCategoryChange(e) {
    const index = e.detail.value;
    const selectedCategory = this.data.categories[index];
    
    this.setData({
      selectedCategoryIndex: index,
      selectedCategoryName: selectedCategory.name
    });

    // 加载该分类下的商品
    this.loadProductsByCategory(selectedCategory.id);
  },

  // 加载商品（通用方法）
  async loadProducts(categoryId = 0) {
    this.setData({ loading: true, products: [] });
    
    try {
      let products;
      if (categoryId === 0) {
        // 加载所有商品
        products = await productService.list();
      } else {
        // 加载指定分类的商品
        products = await productService.list({ category: categoryId });
      }
      
      console.log('商品数据:', products);
      
      // 为每个商品添加主图URL
      const productsWithImages = products.map(product => ({
        ...product,
        mainImage: getProductMainImage(product)
      }));
      
      this.setData({
        products: productsWithImages,
        loading: false
      });
    } catch (error) {
      console.error('加载商品失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载商品失败',
        icon: 'none'
      });
    }
  },

  // 加载推荐商品
  async loadFeaturedProducts() {
    this.setData({ loading: true, products: [] });
    
    try {
      console.log('加载推荐商品');
      
      // 调用推荐商品API
      const products = await productService.list({ is_featured: true });
      
      console.log('推荐商品数据:', products);
      
      // 为每个商品添加主图URL
      const productsWithImages = products.map(product => ({
        ...product,
        mainImage: getProductMainImage(product)
      }));
      
      this.setData({
        products: productsWithImages,
        loading: false
      });
      
      // 显示推荐商品提示
      if (productsWithImages.length === 0) {
        wx.showToast({
          title: '暂无推荐商品',
          icon: 'none'
        });
      } else {
        wx.showToast({
          title: `共${productsWithImages.length}个推荐商品`,
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('加载推荐商品失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载推荐商品失败',
        icon: 'none'
      });
    }
  },

  // 执行搜索
  async performSearch(keyword) {
    this.setData({ loading: true, products: [] });
    
    try {
      console.log('执行搜索，关键词:', keyword);
      
      // 调用商品搜索API
      const products = await productService.list({ search: keyword });
      
      console.log('搜索结果:', products);
      
      // 为每个商品添加主图URL
      const productsWithImages = products.map(product => ({
        ...product,
        mainImage: getProductMainImage(product)
      }));
      
      this.setData({
        products: productsWithImages,
        loading: false
      });
      
      // 显示搜索结果提示
      if (productsWithImages.length === 0) {
        wx.showToast({
          title: '未找到相关商品',
          icon: 'none'
        });
      } else {
        wx.showToast({
          title: `找到${productsWithImages.length}个商品`,
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('搜索失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '搜索失败',
        icon: 'none'
      });
    }
  },

  // 根据分类加载商品
  async loadProductsByCategory(categoryId) {
    this.setData({ loading: true, products: [] });
    
    try {
      let products;
      if (categoryId === 0) {
        // 加载所有商品
        products = await productService.list();
      } else {
        // 加载指定分类的商品
        products = await productService.list({ category: categoryId });
      }
      
      console.log('分类商品数据:', products);
      
      // 为每个商品添加主图URL
      const productsWithImages = products.map(product => ({
        ...product,
        mainImage: getProductMainImage(product)
      }));
      
      this.setData({
        products: productsWithImages,
        loading: false
      });
    } catch (error) {
      console.error('加载商品失败:', error);
      this.setData({
        loading: false,
        products: []
      });
      wx.showToast({
        title: '加载商品失败',
        icon: 'none'
      });
    }
  },

  // 商品点击
  onProductTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/product/detail/detail?id=${id}`
    });
  },

  // 查看所有商品
  goProductList() {
    wx.navigateTo({
      url: '/pages/product/list/list'
    });
  }
});


