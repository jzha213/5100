const productService = require('../../../services/product');
const { getProductMainImage } = require('../../../utils/image');

Page({
  data:{ 
    items: [],
    loading: false
  },
  
  onLoad(){ 
    this.load(); 
  },
  
  async load(){
    this.setData({ loading: true });
    try{ 
      const data = await productService.list(); 
      console.log('商品列表数据:', data);
      
      // 为每个商品添加主图URL
      const itemsWithImages = data.map(product => ({
        ...product,
        mainImage: getProductMainImage(product)
      }));
      
      this.setData({ 
        items: itemsWithImages,
        loading: false
      }); 
    }
    catch(e){ 
      console.error('加载商品失败:', e);
      this.setData({ 
        loading: false,
        items: []
      });
      wx.showToast({ title:'加载失败', icon:'none' }); 
    }
  },
  
  goDetail(e){ 
    const id = e.currentTarget.dataset.id; 
    wx.navigateTo({ url:`/pages/product/detail/detail?id=${id}` }); 
  }
});

