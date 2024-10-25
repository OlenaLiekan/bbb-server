const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const {
  Product,
  ProductInfo,
  ProductSlide,
  ProductText,
  ProductApplying,
  ProductCompound,
} = require('../models/models');
const ApiError = require('../error/ApiError');
const { upload } = require('../cloudinary');

class ProductController {
  async create(req, res, next) {
    try {
      let {
        name,
        code,
        price,
        discountPrice,
        isPromo,
        categoryId,
        brandId,
        typeId,
        info,
        isLashes,
        available,
        topProduct,
        text,
        compound,
        applying,
      } = req.body;
      if (!req.files) return res.send('Please upload an image');
      const { img } = req.files;
      let { slide } = req.files ? req.files : '';
      const fileTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!fileTypes.includes(img.mimetype)) {
        return res.send('Image formats supported: JPG, PNG, JPEG');
      }
      const cloudFile = await upload(img.tempFilePath);
      const fileName = cloudFile.secure_url.split('/').pop();
      let slideName = '';
      let slideNames = [];

      if (slide) {
        if (slide.length > 1) {
          for (let image of slide) {
            const resFile = await upload(image.tempFilePath);
            const slideName = resFile.secure_url.split('/').pop();
            slideNames = [...slideNames, slideName];
          }
        } else {
          const slideFile = await upload(slide.tempFilePath);
          slideName = slideFile.secure_url.split('/').pop();
        }
      }

      const product = await Product.create({
        name,
        code,
        price,
        discountPrice,
        isPromo,
        categoryId,
        brandId,
        typeId,
        img: fileName,
        isLashes,
        available,
        topProduct,
      });

      ProductText.create({
        text: text,
        productId: product.id,
      });

      ProductApplying.create({
        text: applying,
        productId: product.id,
      });

      ProductCompound.create({
        text: compound,
        productId: product.id,
      });

      if (info) {
        info = JSON.parse(info);
        info.forEach(i =>
          ProductInfo.create({
            title: i.title,
            description: i.description,
            productId: product.id,
          })
        );
      }

      if (slide) {
        if (slide.length > 1) {
          slideNames.forEach(img => {
            ProductSlide.create({
              slideImg: img,
              productId: product.id,
            });
          });
        } else {
          ProductSlide.create({
            slideImg: slideName,
            productId: product.id,
          });
        }
      }

      return res.json(product);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async destroy(req, res) {
    const { id } = req.query;

    const product = await Product.destroy({
      where: { id },
    });
    return res.json(product);
  }

  async update(req, res, next) {
    const { id } = req.params;
    let {
      name,
      rating,
      code,
      price,
      discountPrice,
      isPromo,
      categoryId,
      brandId,
      typeId,
      info,
      isLashes,
      text,
      applying,
      compound,
      deletedSlideId,
      available,
      topProduct,
    } = req.body;

    const { img } = req.files ? req.files : '';
    const { slide } = req.files ? req.files : '';

    let fileName = '';
    let slideNames = [];
    let slideName = '';

    if (img) {
      const cloudFile = await upload(img.tempFilePath);
      fileName = cloudFile.secure_url.split('/').pop();
    }

    if (slide) {
      if (slide.length > 1) {
        for (let image of slide) {
          const resFile = await upload(image.tempFilePath);
          const slideName = resFile.secure_url.split('/').pop();
          slideNames = [...slideNames, slideName];
        }
      } else {
        const slideFile = await upload(slide.tempFilePath);
        slideName = slideFile.secure_url.split('/').pop();
      }
    }

    const options = { where: { id: id } };
    let props = {};

    if (img) {
      props = { ...props, img: fileName };
    }
    if (name) {
      props = { ...props, name };
    }
    if (code) {
      props = { ...props, code };
    }
    if (price) {
      props = { ...props, price };
    }
    if (categoryId) {
      props = { ...props, categoryId };
    }
    if (brandId) {
      props = { ...props, brandId };
    }
    if (typeId) {
      props = { ...props, typeId };
    }
    if (rating) {
      props = { ...props, rating };
    }
    props = { ...props, discountPrice };

    props = { ...props, isLashes, available, topProduct, isPromo };

    const product = await Product.update(props, options);

    if (text) {
      const productId = req.params.id;
      const textOps = { where: { productId: productId } };
      ProductText.update(
        {
          text: text,
        },
        textOps
      );
    }

    if (applying) {
      const productId = req.params.id;
      const textOps = { where: { productId: productId } };
      ProductApplying.update(
        {
          text: applying,
        },
        textOps
      );
    }

    if (compound) {
      const productId = req.params.id;
      const textOps = { where: { productId: productId } };
      ProductCompound.update(
        {
          text: compound,
        },
        textOps
      );
    }

    if (info) {
      const productId = req.params.id;
      const infoOps = { where: { productId: productId } };
      ProductInfo.destroy(infoOps);
      info = JSON.parse(info);
      info.forEach(i =>
        ProductInfo.create({
          title: i.title,
          description: i.description,
          productId: productId,
        })
      );
    }

    if (deletedSlideId) {
      deletedSlideId = JSON.parse(deletedSlideId);
      deletedSlideId.forEach(slideId => {
        const slideOps = { where: { id: slideId } };
        ProductSlide.destroy(slideOps);
      });
    }

    if (slide) {
      const productId = req.params.id;
      if (slide.length > 1) {
        slideNames.forEach(img => {
          ProductSlide.create({
            slideImg: img,
            productId: productId,
          });
        });
      } else {
        ProductSlide.create({
          slideImg: slideName,
          productId: productId,
        });
      }
    }

    return res.json(product);
  }

  async getAll(req, res) {
    const {
      categoryId,
      brandId,
      typeId,
      limit = 24,
      page = 1,
      rating,
      name,
      price,
      discountPrice,
      isPromo,
    } = req.query;
    const offset = page * limit - limit;

    let sort = req.query.sort ? req.query.sort : 'rating';
    let order = req.query.order ? req.query.order : 'ASC';

    let options = {
      limit,
      offset,
      order: [[sort, order]],
      distinct: true,
      where: {},
      include: [
        { model: ProductInfo, as: 'info' },
        { model: ProductSlide, as: 'slide' },
        { model: ProductText, as: 'text' },
        { model: ProductApplying, as: 'applying' },
        { model: ProductCompound, as: 'compound' },
      ],
    };

    if (categoryId) {
      options.where = { ...options.where, categoryId };
    }

    if (brandId) {
      options.where = { ...options.where, brandId };
    }

    if (typeId) {
      options.where = { ...options.where, typeId };
    }

    if (rating) {
      options.where = { ...options.where, rating };
    }

    if (name) {
      options.where = { ...options.where, name: { [Op.iLike]: `%${name}%` } };
    }

    if (price) {
      options.where = { ...options.where, price };
    }

    if (discountPrice) {
      options.where = { ...options.where, discountPrice };
    }

    if (isPromo) {
      options.where = { ...options.where, isPromo };
    }

    const products = await Product.findAndCountAll(options);
    products.sort = req.query.sort;
    return res.json(products);
  }

  async getOne(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findOne({
        where: { id },
        include: [
          { model: ProductInfo, as: 'info' },
          { model: ProductSlide, as: 'slide' },
          { model: ProductText, as: 'text' },
          { model: ProductApplying, as: 'applying' },
          { model: ProductCompound, as: 'compound' },
        ],
      });
      return res.json(product);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }
}

module.exports = new ProductController();
