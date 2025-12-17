const sequelize = require('../db');
const { DataTypes } = require('sequelize');

const User = sequelize.define('user', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  firstName: { type: DataTypes.STRING },
  lastName: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING, unique: true },
  phone: { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING, validate: 6 },
  role: { type: DataTypes.STRING, defaultValue: 'USER' },
});

const Basket = sequelize.define('basket', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
});

const BasketProduct = sequelize.define('basket_product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
});

const UserOrder = sequelize.define('user_order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  sum: { type: DataTypes.INTEGER, allowNull: false },
  deliveryPrice: { type: DataTypes.STRING, allowNull: false },
  orderNumber: { type: DataTypes.STRING, allowNull: false },
  userComment: { type: DataTypes.STRING, allowNull: true },
  promocodeName: { type: DataTypes.STRING, allowNull: true },
  promocodeValue: { type: DataTypes.STRING, allowNull: true },
  promocodeBrandId: { type: DataTypes.STRING, allowNull: true },
});

const UserPromocode = sequelize.define('user_promocode', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  orderId: { type: DataTypes.STRING, allowNull: false },
});

const UserAddress = sequelize.define('user_address', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  company: { type: DataTypes.STRING },
  firstAddress: { type: DataTypes.STRING, allowNull: false },
  secondAddress: { type: DataTypes.STRING },
  city: { type: DataTypes.STRING, allowNull: false },
  country: { type: DataTypes.STRING, allowNull: false },
  region: { type: DataTypes.STRING, allowNull: false },
  postalCode: { type: DataTypes.STRING, allowNull: false },
  mainAddress: { type: DataTypes.BOOLEAN, allowNull: false },
});

const OrderItem = sequelize.define('order_item', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING, allowNull: false },
  img: { type: DataTypes.STRING, allowNull: false },
  brandId: { type: DataTypes.STRING, allowNull: false },
  promocodeAllowed: { type: DataTypes.BOOLEAN, allowNull: false },
  prevPrice: { type: DataTypes.NUMBER, allowNull: false },
});

const Product = sequelize.define('product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, unique: true, allowNull: false },
  price: { type: DataTypes.NUMBER, allowNull: false },
  rating: { type: DataTypes.NUMBER, defaultValue: 0 },
  img: { type: DataTypes.STRING, allowNull: false },
  isLashes: { type: DataTypes.BOOLEAN, allowNull: false },
  available: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  topProduct: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  exclusiveProduct: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  discountPrice: { type: DataTypes.NUMBER, allowNull: true, defaultValue: 0 },
  isPromo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  newProduct: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
});

const ProductSlide = sequelize.define('product_slide', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  slideImg: { type: DataTypes.STRING, allowNull: false },
});

const Category = sequelize.define('category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, unique: true, allowNull: false },
  subMenu: { type: DataTypes.BOOLEAN, allowNull: false },
  position: { type: DataTypes.STRING, allowNull: false },
});

const Type = sequelize.define('type', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, unique: true, allowNull: false },
  categoryId: { type: DataTypes.INTEGER, allowNull: false },
  img: { type: DataTypes.STRING, allowNull: false },
});

const Brand = sequelize.define('brand', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, unique: true, allowNull: false },
  img: { type: DataTypes.STRING, allowNull: false },
  discount: { type: DataTypes.NUMBER, allowNull: true },
});

const Rating = sequelize.define('rating', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.INTEGER, allowNull: false },
  userName: { type: DataTypes.STRING },
});

const Review = sequelize.define('review', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  text: { type: DataTypes.STRING, allowNull: false },
});

const Reply = sequelize.define('reply', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  text: { type: DataTypes.STRING, allowNull: false },
});

const ProductRelated = sequelize.define('product_related', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  referenceCode: { type: DataTypes.STRING, allowNull: false },
});

const ProductInfo = sequelize.define('product_info', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING, allowNull: false },
});

const ProductText = sequelize.define('product_text', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  text: { type: DataTypes.TEXT, allowNull: false },
});

const ProductApplying = sequelize.define('product_applying', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  text: { type: DataTypes.TEXT, allowNull: true },
});

const ProductCompound = sequelize.define('product_compound', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  text: { type: DataTypes.TEXT, allowNull: true },
});

const TypeBrand = sequelize.define('type_brand', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
});

const Slide = sequelize.define('slide', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  img: { type: DataTypes.STRING, allowNull: false },
  url: { type: DataTypes.STRING, allowNull: true },
});

const Logo = sequelize.define('logo', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  img: { type: DataTypes.STRING, allowNull: false },
  logoName: { type: DataTypes.STRING, allowNull: true },
});

const DeliveryPrice = sequelize.define('delivery', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  price: { type: DataTypes.STRING, allowNull: false },
  requiredSum: { type: DataTypes.STRING, allowNull: true },
  type: { type: DataTypes.STRING, allowNull: false },
});

const PaymentDetails = sequelize.define('payment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  account: { type: DataTypes.STRING, allowNull: false },
  recipient: { type: DataTypes.STRING, allowNull: false },
  available: { type: DataTypes.BOOLEAN, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
});

const Promocode = sequelize.define('promocode', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  value: { type: DataTypes.STRING, allowNull: false },
  newMember: { type: DataTypes.BOOLEAN, allowNull: false },
  reusable: { type: DataTypes.BOOLEAN, allowNull: false },
  brandId: { type: DataTypes.STRING, allowNull: false },
});

const Promotion = sequelize.define('promotion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  startDate: { type: DataTypes.STRING, allowNull: false },
  finishDate: { type: DataTypes.STRING, allowNull: false },
});

const PromotionInfo = sequelize.define('promotion_info', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING, allowNull: false },
});

const PaymentInformation = sequelize.define(
  'PaymentInformation',
  {
    transactionID: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    transactionSignature: { type: DataTypes.STRING, allowNull: false },
    orderID: { type: DataTypes.STRING, allowNull: false },
    customerName: { type: DataTypes.STRING, allowNull: false },
    customerEmail: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.DOUBLE, allowNull: false },
    paymentMethod: { type: DataTypes.STRING, allowNull: true },
    paymentStatus: { type: DataTypes.STRING, allowNull: true },
    startTime: { type: DataTypes.DATE, allowNull: false },
    phoneNumber: { type: DataTypes.STRING, allowNull: true },
    reference: { type: DataTypes.STRING, allowNull: true },
    entity: { type: DataTypes.STRING, allowNull: true },
    orderAddress: { type: DataTypes.STRING, allowNull: true },
    customerPhone: { type: DataTypes.STRING, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    customerCompany: { type: DataTypes.STRING, allowNull: true },
    sentToClient: { type: DataTypes.STRING, allowNull: true },
    sentToShop: { type: DataTypes.STRING, allowNull: true },
    sentReferencePaid: { type: DataTypes.STRING, allowNull: true },
  },
  {
    timestamps: false,
  }
);

const PendingWebhook = sequelize.define(
  'pending_webhook',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    transactionID: { type: DataTypes.STRING, allowNull: false },
    payload: { type: DataTypes.TEXT, allowNull: false },
    paymentStatus: { type: DataTypes.STRING, allowNull: false },
    paymentMethod: { type: DataTypes.STRING, allowNull: false },
    retryCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    errorReason: { type: DataTypes.STRING, allowNull: true },
    processedAt: { type: DataTypes.DATE, allowNull: true },
    lastError: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'pending_webhooks',
  }
);

User.hasOne(Basket);
Basket.belongsTo(User);

User.hasMany(UserOrder, { as: 'order' });
UserOrder.belongsTo(User);

User.hasMany(UserPromocode, { as: 'promocode' });
UserPromocode.belongsTo(User);

User.hasMany(UserAddress, { as: 'address' });
UserAddress.belongsTo(User);

UserOrder.hasMany(OrderItem, { as: 'item' });
OrderItem.belongsTo(UserOrder);

User.hasMany(Rating);
Rating.belongsTo(User);

User.hasMany(Review);
Review.belongsTo(User);

Basket.hasMany(BasketProduct);
BasketProduct.belongsTo(Basket);

Category.hasMany(Type);
Type.belongsTo(Category);

Category.hasMany(Product);
Product.belongsTo(Category);

Type.hasMany(Product);
Product.belongsTo(Type);

Brand.hasMany(Product);
Product.belongsTo(Brand);

Product.hasMany(Rating);
Rating.belongsTo(Product);

Product.hasMany(Review);
Review.belongsTo(Product);

Review.hasOne(Reply);
Reply.belongsTo(Review);

Product.hasMany(BasketProduct);
BasketProduct.belongsTo(Product);

Product.hasMany(ProductRelated, { as: 'related' });
ProductRelated.belongsTo(Product);

Product.hasMany(ProductInfo, { as: 'info' });
ProductInfo.belongsTo(Product);

Product.hasMany(ProductSlide, { as: 'slide' });
ProductSlide.belongsTo(Product);

Product.hasMany(ProductText, { as: 'text' });
ProductText.belongsTo(Product);

Product.hasMany(ProductCompound, { as: 'compound' });
ProductCompound.belongsTo(Product);

Product.hasMany(ProductApplying, { as: 'applying' });
ProductApplying.belongsTo(Product);

Type.belongsToMany(Brand, { through: TypeBrand });
Brand.belongsToMany(Type, { through: TypeBrand });

Promotion.hasMany(PromotionInfo, { as: 'info' });
PromotionInfo.belongsTo(Promotion);

module.exports = {
  User,
  UserOrder,
  UserAddress,
  OrderItem,
  Basket,
  BasketProduct,
  Product,
  Category,
  Type,
  Brand,
  Rating,
  Review,
  Reply,
  TypeBrand,
  ProductRelated,
  ProductInfo,
  ProductSlide,
  Slide,
  Logo,
  ProductText,
  ProductCompound,
  ProductApplying,
  DeliveryPrice,
  PaymentDetails,
  Promocode,
  PromotionInfo,
  Promotion,
  UserPromocode,
  PaymentInformation,
  PendingWebhook,
};
