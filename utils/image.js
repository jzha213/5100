const config = require('../config/env');

/**
 * 处理图片URL，确保小程序能够正确显示
 * @param {string} imageUrl - 原始图片URL
 * @param {string} defaultImage - 默认图片路径
 * @returns {string} - 处理后的图片URL
 */
function processImageUrl(imageUrl, defaultImage = '/static/assets/images/default-product.svg') {
  if (!imageUrl) {
    // 如果没有图片URL，返回默认图片的完整URL
    return `${config.baseURL}${defaultImage}`;
  }
  
  // 如果已经是完整URL（包含http），直接返回
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // 如果是相对路径，拼接基础URL
  if (imageUrl.startsWith('/')) {
    return `${config.baseURL}${imageUrl}`;
  }
  
  // 其他情况，拼接基础URL和媒体路径
  return `${config.baseURL}/media/${imageUrl}`;
}

/**
 * 获取商品主图URL
 * @param {Object} product - 商品对象
 * @returns {string} - 主图URL
 */
function getProductMainImage(product) {
  if (!product) {
    return processImageUrl(null);
  }
  
  // 优先使用 primary_image 字段（商品列表API返回）
  if (product.primary_image) {
    return processImageUrl(product.primary_image);
  }
  
  // 处理订单中的图片URL（直接存储在product_image字段中）
  if (product.product_image) {
    return processImageUrl(product.product_image);
  }
  
  // 如果没有 primary_image，查找 images 数组
  if (product.images && product.images.length > 0) {
    // 查找主图
    const primaryImage = product.images.find(img => img.is_primary);
    if (primaryImage) {
      return processImageUrl(primaryImage.image_url);
    }
    
    // 如果没有主图，使用第一张图片
    return processImageUrl(product.images[0].image_url);
  }
  
  // 如果都没有，返回默认图片
  return processImageUrl(null);
}

/**
 * 获取用户头像URL
 * @param {string} avatarUrl - 头像URL
 * @returns {string} - 处理后的头像URL
 */
function getUserAvatar(avatarUrl) {
  if (!avatarUrl) {
    return processImageUrl(null, '/static/assets/images/default-avatar.png');
  }
  
  // 如果已经是完整URL，直接返回
  if (avatarUrl.startsWith('http')) {
    return avatarUrl;
  }
  
  // 处理相对路径
  return processImageUrl(avatarUrl);
}

/**
 * 获取分类图标URL
 * @param {string} iconUrl - 分类图标URL（可能来自 icon_file 或 icon 字段）
 * @returns {string} - 处理后的图标URL
 */
function getCategoryIcon(iconUrl) {
  if (!iconUrl) {
    // 如果没有图标，返回默认图标（可以是一个默认的 SVG 或 emoji）
    return null; // 返回 null，让前端显示默认的 emoji
  }
  
  // 如果已经是完整URL，直接返回
  if (iconUrl.startsWith('http')) {
    return iconUrl;
  }
  
  // 如果是相对路径（以 / 开头），拼接基础URL
  if (iconUrl.startsWith('/')) {
    return `${config.baseURL}${iconUrl}`;
  }
  
  // 其他情况，拼接基础URL和媒体路径
  return `${config.baseURL}/media/${iconUrl}`;
}

module.exports = {
  processImageUrl,
  getProductMainImage,
  getUserAvatar,
  getCategoryIcon
};
