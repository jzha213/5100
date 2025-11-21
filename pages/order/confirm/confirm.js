const orderService = require('../../../services/order');
const productService = require('../../../services/product');
const addressService = require('../../../services/address');
const cartService = require('../../../services/cart');
const { getProductMainImage, processImageUrl } = require('../../../utils/image');

Page({
  data:{ 
    pid: null, 
    qty: 1,
    product: null,
    checkoutItems: [], // 购物车商品列表
    checkoutGroups: [], // 按地址分组的商品列表
    remark: '',
    loading: true,
    error: false,
    selectedAddress: null,
    addresses: [],
    showAddressModal: false,
    mode: 'confirmOrder', // 页面模式：confirmOrder、addToCart 或 checkout
    navigationTitle: '确认订单',
    mainButtonText: '提交订单'
  },
  
  onLoad(q){ 
    console.log('onLoad - 接收到的参数:', q);
    const mode = q.mode || 'confirmOrder';
    let navigationTitle = '确认订单';
    let mainButtonText = '提交订单';
    
    if (mode === 'addToCart') {
      navigationTitle = '加入购物车';
      mainButtonText = '加入购物车';
    } else if (mode === 'checkout') {
      navigationTitle = '确认订单';
      mainButtonText = '提交订单';
    }
    
    console.log('onLoad - 设置模式:', mode, '标题:', navigationTitle, '按钮:', mainButtonText);
    
    this.setData({ 
      pid: q.pid, 
      qty: Number(q.qty || 1),
      mode: mode,
      navigationTitle: navigationTitle,
      mainButtonText: mainButtonText
    }); 
    
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: navigationTitle
    });
    
    console.log('订单确认页加载:', { pid: q.pid, qty: q.qty, mode: mode });
    
    // 根据模式加载不同的数据
    if (mode === 'checkout') {
      this.loadCheckoutItems();
    } else {
      this.loadProduct();
    }
    
    // 加载地址（所有模式都需要地址）
    // 先检查 token
    const token = wx.getStorageSync('token');
    if (token) {
      console.log('加载地址信息');
      this.loadAddresses();
    }
  },

  onShow() {
    // 先检查是否有 token
    const token = wx.getStorageSync('token');
    if (!token) {
      return;
    }
    // 页面显示时刷新地址列表，以便显示新增的地址
    this.loadAddresses();
  },

  // 加载购物车商品
  loadCheckoutItems() {
    try {
      const app = getApp();
      if (!app.globalData) {
        app.globalData = {};
      }
      
      const checkoutItems = app.globalData.checkoutItems || [];
      
      console.log('加载购物车商品 (confirm.js - globalData):', checkoutItems);
      console.log('购物车商品详情 (confirm.js - globalData):', checkoutItems.map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product_name: item.product_name,
        product_id_type: typeof item.product_id,
        quantity_type: typeof item.quantity
      })));
      
      // 检查是否有无效数据
      const invalidItems = checkoutItems.filter(item => 
        !item.product_id || item.product_id === null || item.product_id === undefined ||
        !item.quantity || item.quantity === null || item.quantity === undefined || item.quantity <= 0
      );
      
      if (invalidItems.length > 0) {
        console.error('发现无效的购物车商品 (confirm.js):', invalidItems);
        wx.showToast({
          title: '购物车数据异常，请重新加载',
          icon: 'none'
        });
        this.setData({
          loading: false,
          error: true
        });
        return;
      }
      
      if (checkoutItems.length === 0) {
        this.setData({
          loading: false,
          error: true
        });
        wx.showToast({
          title: '没有选中的商品',
          icon: 'none'
        });
        return;
      }
      
      // 按地址分组商品，并处理图片URL
      const addressGroups = {};
      checkoutItems.forEach(item => {
        const addressId = item.address_id || 'no_address';
        if (!addressGroups[addressId]) {
          // 构建完整的地址对象
          const fullAddress = item.address_info ? {
            id: item.address_info.id,
            name: item.address_info.name,
            phone: item.address_info.phone,
            province: item.address_info.province || '',
            city: item.address_info.city || '',
            district: item.address_info.district || '',
            street: item.address_info.street || '',
            detail_address: item.address_info.detail_address || '',
            is_default: item.address_info.is_default || false
          } : null;
          
          addressGroups[addressId] = {
            address_id: item.address_id,
            address_info: item.address_info,
            selectedAddress: fullAddress, // 使用完整的地址对象
            items: [],
            groupTotal: 0
          };
        }
        // 确保商品图片URL是完整的
        const processedItem = {
          ...item,
          product_image: item.product_image ? processImageUrl(item.product_image) : null
        };
        addressGroups[addressId].items.push(processedItem);
        addressGroups[addressId].groupTotal += item.subtotal;
      });
      
      const checkoutGroups = Object.values(addressGroups);
      const checkoutTotal = checkoutItems.reduce((sum, item) => sum + item.subtotal, 0);
      
      this.setData({
        checkoutItems: checkoutItems,
        checkoutGroups: checkoutGroups,
        checkoutTotal: checkoutTotal.toFixed(2),
        loading: false,
        error: false
      });
      
      console.log('确认订单页面分组后的数据 (confirm.js):', this.data.checkoutGroups);
    } catch (error) {
      console.error('加载购物车商品失败:', error);
      this.setData({
        loading: false,
        error: true
      });
      wx.showToast({
        title: '加载商品信息失败',
        icon: 'none'
      });
    }
  },
  
  async loadProduct(){
    this.setData({ loading: true, error: false });
    try {
        const product = await productService.detail(this.data.pid);
        console.log('商品详情:', product);
        
        // 为商品添加主图URL
        const productWithImage = {
          ...product,
          mainImage: getProductMainImage(product)
        };
        
        this.setData({ 
          product: productWithImage,
          loading: false 
        });
    } catch (e) {
      console.error('加载商品失败:', e);
      this.setData({ 
        error: true,
        loading: false 
      });
      wx.showToast({ title: '加载商品失败', icon: 'none' });
    }
  },
  
  // 数量减少
  decreaseQuantity(){
    if (this.data.qty > 1) {
      this.setData({ qty: this.data.qty - 1 });
    }
  },
  
  // 数量增加
  increaseQuantity(){
    const maxStock = this.data.product ? this.data.product.stock : 999;
    if (this.data.qty < maxStock) {
      this.setData({ qty: this.data.qty + 1 });
    } else {
      wx.showToast({ title: '库存不足', icon: 'none' });
    }
  },
  
  // 数量输入变化
  onQuantityChange(e){
    let qty = parseInt(e.detail.value) || 1;
    const maxStock = this.data.product ? this.data.product.stock : 999;
    
    if (qty < 1) qty = 1;
    if (qty > maxStock) {
      qty = maxStock;
      wx.showToast({ title: '超出库存限制', icon: 'none' });
    }
    
    this.setData({ qty });
  },
  
  // 备注输入变化
  onRemarkChange(e){
    this.setData({ remark: e.detail.value });
  },

  // 加载地址列表
  async loadAddresses() {
    // 先检查 token
    const token = wx.getStorageSync('token');
    if (!token) {
      return;
    }
    
    try {
      const response = await addressService.list();
      console.log('地址列表数据:', response);
      const addresses = response.data || response.results || response || [];
      
      // 自动选择默认地址
      const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0];
      
      this.setData({
        addresses: addresses,
        selectedAddress: defaultAddress
      });
    } catch (error) {
      console.error('加载地址失败:', error);
      
      // 如果是认证错误，静默处理
      if (error.statusCode === 401 || (error.data && error.data.message && (error.data.message.includes('需要重新登录') || error.data.message.includes('access_token')))) {
        wx.removeStorageSync('token');
        wx.removeStorageSync('userInfo');
      }
      
      // 地址加载失败不影响订单确认流程
    }
  },

  // 选择地址
  selectAddress() {
    this.setData({ showAddressModal: true });
  },

  // 为特定地址组选择地址
  selectAddressForGroup(e) {
    const groupIndex = e.currentTarget.dataset.groupIndex;
    this.setData({ 
      showAddressModal: true,
      currentGroupIndex: groupIndex 
    });
  },

  // 关闭地址选择弹窗
  closeAddressModal() {
    this.setData({ showAddressModal: false });
  },

  // 选择地址项
  selectAddressItem(e) {
    const index = e.currentTarget.dataset.index;
    const selectedAddress = this.data.addresses[index];
    
    if (this.data.mode === 'checkout' && this.data.currentGroupIndex !== undefined) {
      // 为特定地址组设置地址
      const checkoutGroups = this.data.checkoutGroups;
      checkoutGroups[this.data.currentGroupIndex].selectedAddress = selectedAddress;
      this.setData({
        checkoutGroups: checkoutGroups,
        showAddressModal: false,
        currentGroupIndex: undefined
      });
    } else {
      // 为单个商品设置地址
      this.setData({
        selectedAddress: selectedAddress,
        showAddressModal: false
      });
    }
  },

  // 新增地址
  addNewAddress() {
    this.setData({ showAddressModal: false });
    wx.navigateTo({
      url: '/pages/address/edit/edit'
    });
  },
  
  // 处理主操作（提交订单或加入购物车）
  handleMainAction(){
    console.log('handleMainAction - 当前模式:', this.data.mode);
    if (this.data.mode === 'addToCart') {
      console.log('执行加入购物车操作');
      this.addToCart();
    } else if (this.data.mode === 'checkout') {
      console.log('执行购物车结算操作');
      this.submitCheckoutOrder();
    } else {
      console.log('执行提交订单操作');
      this.submitOrder();
    }
  },

  // 加入购物车
  async addToCart(){
    if (!this.data.product) {
      wx.showToast({ title: '商品信息加载中，请稍候', icon: 'none' });
      return;
    }
    
    if (this.data.qty <= 0) {
      wx.showToast({ title: '请选择购买数量', icon: 'none' });
      return;
    }

    if (!this.data.selectedAddress) {
      wx.showToast({ title: '请选择收货地址', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '加入购物车中...' });
    try{
      console.log('开始加入购物车:', { 
        product_id: this.data.pid, 
        quantity: this.data.qty,
        address_id: this.data.selectedAddress.id,
        notes: this.data.remark
      });
      
      // 调用购物车服务
      const cartService = require('../../../services/cart');
      const data = await cartService.addItem({ 
        product_id: this.data.pid, 
        quantity: this.data.qty,
        address_id: this.data.selectedAddress.id,
        notes: this.data.remark
      });
      
      console.log('加入购物车成功:', data);
      wx.hideLoading();
      wx.showToast({ title:'已加入购物车', icon: 'success' });
      
      // 跳转到购物车页面
      setTimeout(() => {
        wx.switchTab({ url: '/pages/cart/cart' });
      }, 1500);
    }catch(e){ 
      console.error('加入购物车失败:', e);
      wx.hideLoading();
      wx.showToast({ title: e.message || '加入购物车失败', icon:'none' }); 
    }
  },

  async submitOrder(){
    if (!this.data.product) {
      wx.showToast({ title: '商品信息加载中，请稍候', icon: 'none' });
      return;
    }
    
    if (this.data.qty <= 0) {
      wx.showToast({ title: '请选择购买数量', icon: 'none' });
      return;
    }

    if (!this.data.selectedAddress) {
      wx.showToast({ title: '请选择收货地址', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '提交中...' });
    try{
      console.log('开始提交订单:', { 
        product_id: this.data.pid, 
        quantity: this.data.qty,
        remark: this.data.remark,
        address_id: this.data.selectedAddress.id
      });
      
      const data = await orderService.create({ 
        product_id: this.data.pid, 
        quantity: this.data.qty,
        remark: this.data.remark,
        address_id: this.data.selectedAddress.id
      });
      
      console.log('订单创建成功:', data);
      wx.hideLoading();
      wx.showToast({ title:'下单成功' });
      
      const id = data.id || (data.order && data.order.id) || (data.data && data.data.id);
      if(id){ 
        setTimeout(() => {
          wx.redirectTo({ url:`/pages/order/detail/detail?id=${id}` }); 
        }, 1500);
      }
    }catch(e){ 
      console.error('订单创建失败:', e);
      wx.hideLoading();
      wx.showToast({ title: e.message || '下单失败', icon:'none' }); 
    }
  },

  // 购物车结算提交订单
  async submitCheckoutOrder(){
    if (this.data.checkoutGroups.length === 0) {
      wx.showToast({ title: '没有选中的商品', icon: 'none' });
      return;
    }
    
    // 验证所有组都有地址
    const missingAddressGroup = this.data.checkoutGroups.find(group => !group.selectedAddress);
    if (missingAddressGroup) {
      wx.showToast({ title: '部分订单没有选择收货地址', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '提交中...' });
    try{
      console.log('开始提交购物车订单 (confirm.js):', { 
        groups: this.data.checkoutGroups
      });
      
      // 使用地址组中的selectedAddress创建订单
      const orderPromises = this.data.checkoutGroups.map(async (group) => {
        console.log('处理地址组 (confirm.js):', group);
        console.log('组内商品 (confirm.js):', group.items);
        
        const orderData = {
          items: group.items.map(item => {
            console.log('--- 开始处理商品项 (confirm.js) ---');
            console.log('完整商品项对象:', item);
            console.log('商品ID (confirm.js):', item.product_id, '类型:', typeof item.product_id);
            console.log('商品数量 (confirm.js):', item.quantity, '类型:', typeof item.quantity);
            console.log('商品名称 (confirm.js):', item.product_name);
            console.log('商品价格 (confirm.js):', item.product_price);
            
            // 验证数据完整性
            if (!item.product_id || item.product_id === null || item.product_id === undefined) {
              console.error('商品ID为空 (confirm.js):', item);
              console.error('所有字段:', Object.keys(item));
              console.error('所有值:', Object.values(item));
              throw new Error('商品ID不能为空');
            }
            
            if (!item.quantity || item.quantity <= 0 || item.quantity === null || item.quantity === undefined) {
              console.error('商品数量无效 (confirm.js):', item);
              throw new Error('商品数量必须大于0');
            }
            
            const mappedItem = {
              product_id: item.product_id,
              quantity: item.quantity
            };
            console.log('映射后的商品项:', mappedItem);
            return mappedItem;
          }),
          remark: group.items[0].notes || '',
          address_id: group.selectedAddress.id
        };
        
        console.log('创建订单数据 (confirm.js):', orderData);
        return await orderService.create(orderData);
      });
      
      const orders = await Promise.all(orderPromises);
      
      console.log('所有订单创建成功 (confirm.js):', orders);
      
      // 删除已结算的购物车商品
      await this.deleteCheckedCartItems();
      
      wx.hideLoading();
      
      if (orders.length === 1) {
        wx.showToast({ title:'下单成功' });
        const orderId = orders[0].id || (orders[0].order && orders[0].order.id) || (orders[0].data && orders[0].data.id);
        if(orderId){ 
          setTimeout(() => {
            wx.redirectTo({ url:`/pages/order/detail/detail?id=${orderId}` }); 
          }, 1500);
        }
      } else {
        wx.showToast({ title:`成功创建${orders.length}个订单` });
        setTimeout(() => {
          wx.switchTab({ url: '/pages/order/list/list' });
        }, 1500);
      }
    }catch(e){ 
      console.error('购物车订单创建失败 (confirm.js):', e);
      wx.hideLoading();
      wx.showToast({ title: e.message || '下单失败', icon:'none' }); 
    }
  },

  // 删除已结算的购物车商品
  async deleteCheckedCartItems() {
    try {
      const app = getApp();
      const checkoutItems = app.globalData.checkoutItems || [];
      
      if (checkoutItems.length === 0) {
        console.log('没有需要删除的购物车商品');
        return;
      }
      
      console.log('开始删除已结算的购物车商品:', checkoutItems);
      
      // 删除每个已结算的购物车商品
      const deletePromises = checkoutItems.map(item => {
        console.log('删除购物车商品:', item.id);
        return cartService.deleteItem(item.id);
      });
      
      await Promise.all(deletePromises);
      
      console.log('已删除所有已结算的购物车商品');
      
      // 清空全局数据
      app.globalData.checkoutItems = [];
      
    } catch (error) {
      console.error('删除购物车商品失败:', error);
      // 不显示错误提示，因为订单已经创建成功
    }
  }
});

