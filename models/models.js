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
  discountPrice: { type: DataTypes.NUMBER, allowNull: true, defaultValue: 0 },
  isPromo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
});

const ProductSlide = sequelize.define('product_slide', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  slideImg: { type: DataTypes.STRING, allowNull: false },
});

const Category = sequelize.define('category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, unique: true, allowNull: false },
  subMenu: { type: DataTypes.BOOLEAN, allowNull: false },
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

const PaymentInformation = sequelize.define('PaymentInformation', {
  transactionID: {type: DataTypes.STRING, primaryKey: true, allowNull: false},
  transactionSignature: {type: DataTypes.STRING, allowNull: false},
  orderID: {type: DataTypes.STRING, allowNull: false},
  customerName: {type: DataTypes.STRING, allowNull: false},
  customerEmail: {type: DataTypes.STRING, allowNull: false},
  amount: {type: DataTypes.DOUBLE, allowNull: false},
  paymentMethod: {type: DataTypes.STRING, allowNull: true},
  paymentStatus: {type: DataTypes.STRING, allowNull: true},
  startTime: {type: DataTypes.DATE, allowNull: false},
  phoneNumber: {type: DataTypes.STRING, allowNull: true},
  reference: {type: DataTypes.STRING, allowNull: true},
  entity: {type: DataTypes.STRING, allowNull: true}
}, {
  timestamps: false
});


User.hasOne(Basket);
Basket.belongsTo(User);

User.hasMany(UserOrder, { as: 'order' });
UserOrder.belongsTo(User);

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

Product.hasMany(BasketProduct);
BasketProduct.belongsTo(Product);

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
  TypeBrand,
  ProductInfo,
  ProductSlide,
  Slide,
  Logo,
  ProductText,
  ProductCompound,
  ProductApplying,
  PaymentDetails,
  DeliveryPrice,
  PaymentInformation
};
