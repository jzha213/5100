const orderService = require('../../../services/order');
const { getProductMainImage } = require('../../../utils/image');

Page({
  data:{ 
    items: [],
    loading: false
  },
  
  async onShow(){
    // 先检查是否有 token，避免未登录时调用需要认证的 API
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ 
        loading: false,
        items: []
      });
      return;
    }
    
    this.setData({ loading: true });
    try{ 
      const items = await orderService.list(); 
      console.log('订单列表数据:', items);
      
      // 处理订单数据，为每个商品添加主图URL
      const processedItems = (items.results || items).map(order => {
        if (order.items && order.items.length > 0) {
          const processedItems = order.items.map(item => {
            console.log('处理订单商品:', item);
            console.log('商品图片URL:', item.product_image);
            
            // 直接使用product_image字段
            const mainImage = getProductMainImage(item);
            console.log('处理后的图片URL:', mainImage);
            
            return {
              ...item,
              mainImage: mainImage
            };
          });
          return {
            ...order,
            items: processedItems
          };
        }
        return order;
      });
      
      this.setData({ 
        items: processedItems,
        loading: false
      }); 
    }
    catch(e){ 
      console.error('加载订单失败:', e);
      
      // 如果是认证错误，静默处理
      if (e.statusCode === 401 || (e.data && e.data.message && (e.data.message.includes('需要重新登录') || e.data.message.includes('access_token')))) {
        // 清除过期的 token
        wx.removeStorageSync('token');
        wx.removeStorageSync('userInfo');
      }
      
      this.setData({ 
        loading: false,
        items: []
      });
      
      // 只有非认证错误才显示提示
      if (e.statusCode !== 401) {
        wx.showToast({ title:'加载失败', icon:'none' }); 
      }
    }
  },
  
  goDetail(e){ 
    const id = e.currentTarget.dataset.id; 
    wx.navigateTo({ url:`/pages/order/detail/detail?id=${id}` }); 
  }
});

