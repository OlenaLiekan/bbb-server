const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const {
  Product,
  ProductInfo,
  ProductSlide,
  ProductText,
  ProductApplying,
  ProductCompound,
  ProductRelated,
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
        related,
        isLashes,
        variant,
        kitId,
        available,
        topProduct,
        exclusiveProduct,
        text,
        newProduct,
        compound,
        applying,
        kitImg,
        kitSlide,
      } = req.body;

      const { img } = req.files ? req.files : '';
      let { slide } = req.files ? req.files : '';

      let fileName = '';

      if (img) {
        const fileTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!fileTypes.includes(img.mimetype)) {
          return res.send('Image formats supported: JPG, PNG, JPEG');
        }
        const cloudFile = await upload(img.tempFilePath);
        fileName = cloudFile.secure_url.split('/').pop();
      } else if (kitImg) {
        fileName = kitImg;
      }

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
      } else if (kitSlide) {
        if (kitSlide.length > 0) {
          slideNames = kitSlide.map(kitSlide => kitSlide.slideImg);
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
        exclusiveProduct,
        newProduct,
        kitId,
        variant,
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

      if (related) {
        related = JSON.parse(related);
        related.forEach(i =>
          ProductRelated.create({
            referenceCode: i.referenceCode,
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

      if (kitSlide) {
        if (kitSlide.length > 0) {
          slideNames.forEach(slideName => {
            ProductSlide.create({
              slideImg: slideName,
              productId: product.id,
            });
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
      variant,
      rating,
      code,
      price,
      discountPrice,
      isPromo,
      categoryId,
      brandId,
      typeId,
      info,
      related,
      isLashes,
      text,
      applying,
      compound,
      deletedSlideId,
      available,
      topProduct,
      exclusiveProduct,
      newProduct,
      kitId,
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

    if (kitId) {
      props = { ...props, kitId };
      props = { ...props, variant };
    }

    props = {
      ...props,
      isLashes,
      available,
      topProduct,
      exclusiveProduct,
      isPromo,
      discountPrice,
      newProduct,
    };

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

    if (related) {
      const productId = req.params.id;
      const relatedOps = { where: { productId: productId } };
      ProductRelated.destroy(relatedOps);
      related = JSON.parse(related);
      related.forEach(i =>
        ProductRelated.create({
          referenceCode: i.referenceCode,
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
      kitId,
      uniqueByKitId,
    } = req.query;
    const offset = page * limit - limit;

    let sort = req.query.sort ? req.query.sort : 'rating';
    let order = req.query.order ? req.query.order : 'ASC';

    let options = {
      order: [
        ['available', 'DESC'],
        [sort, order],
      ],
      distinct: true,
      where: {},
      include: [
        { model: ProductRelated, as: 'related' },
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

    if (kitId) {
      options.where = { ...options.where, kitId };
    }

    let products;

    if (uniqueByKitId) {
      const allProducts = await Product.findAll(options);
      const productsWhithKit = allProducts.filter(product => product.kitId);
      let uniqueProductsArr = [];
      for (let i = 0; i < productsWhithKit.length; i++) {
        const productWithKit = productsWhithKit[i];
        if (uniqueProductsArr.length === 0) {
          products.push(productWithKit);
        } else {
          const result = uniqueProductsArr.find(item => item.kitId === productWithKit.kitId);
          if (!result) {
            products.push(productWithKit);
          }
        }
      }
      products = uniqueProductsArr;
    } else {
      products = await Product.findAndCountAll({ ...options, limit, offset });
    }

    products.sort = req.query.sort;
    return res.json(products);
  }

  async getOne(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findOne({
        where: { id },
        include: [
          { model: ProductRelated, as: 'related' },
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
