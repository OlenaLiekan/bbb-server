const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const {
  Kit,
  KitInfo,
  KitSlide,
  KitText,
  KitApplying,
  KitCompound,
  KitRelated,
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

class KitController {
  async create(req, res, next) {
    try {
      let {
        name,
        variantsList,
        price,
        discountPrice,
        isPromo,
        categoryId,
        brandId,
        typeId,
        isLashes,
        newProduct,
        related,
        info,
        text,
        applying,
        compound,
      } = req.body;

      const { img } = req.files ? req.files : '';
      const { slide } = req.files ? req.files : '';

      let fileName = '';
      let slideNames = [];
      let slideName = '';

      if (img) {
        const fileTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!fileTypes.includes(img.mimetype)) {
          return res.send('Image formats supported: JPG, PNG, JPEG');
        }
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

      const kit = await Kit.create({
        name,
        variantsList,
        price: price ? price : null,
        discountPrice: discountPrice ? discountPrice : null,
        isPromo,
        categoryId,
        brandId,
        typeId,
        img: fileName,
        isLashes,
        newProduct,
      });

      KitText.create({
        text: text,
        kitId: kit.id,
      });

      KitApplying.create({
        text: applying,
        kitId: kit.id,
      });

      KitCompound.create({
        text: compound,
        kitId: kit.id,
      });

      if (info) {
        info = JSON.parse(info);
        info.forEach(i =>
          KitInfo.create({
            title: i.title,
            description: i.description,
            kitId: kit.id,
          })
        );
      }

      if (related) {
        related = JSON.parse(related);
        related.forEach(i =>
          KitRelated.create({
            referenceCode: i.referenceCode,
            kitId: kit.id,
          })
        );
      }

      if (slide) {
        if (slide.length > 1) {
          slideNames.forEach(img => {
            KitSlide.create({
              slideImg: img,
              kitId: kit.id,
            });
          });
        } else {
          KitSlide.create({
            slideImg: slideName,
            kitId: kit.id,
          });
        }
      }

      return res.json(kit);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async update(req, res, next) {
    const { id } = req.params;
    let {
      name,
      variantsList,
      brandId,
      typeId,
      isLashes,
      categoryId,
      isPromo,
      price,
      discountPrice,
      deletedSlideId,
      newProduct,
      related,
      info,
      text,
      applying,
      compound,
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

    if (variantsList) {
      props = { ...props, variantsList };
    }

    if (price) {
      props = { ...props, price };
    }

    if (discountPrice) {
      props = { ...props, discountPrice };
    }

    if (brandId) {
      props = { ...props, brandId };
    }
    if (typeId) {
      props = { ...props, typeId };
    }

    props = {
      ...props,
      isLashes,
      isPromo,
      categoryId,
      newProduct,
    };

    const kit = await Kit.update(props, options);

    if (text) {
      const kitId = req.params.id;
      const textOps = { where: { kitId: kitId } };
      KitText.update(
        {
          text: text,
        },
        textOps
      );
    }

    if (applying) {
      const kitId = req.params.id;
      const textOps = { where: { kitId: kitId } };
      KitApplying.update(
        {
          text: applying,
        },
        textOps
      );
    }

    if (compound) {
      const kitId = req.params.id;
      const textOps = { where: { kitId: kitId } };
      KitCompound.update(
        {
          text: compound,
        },
        textOps
      );
    }

    if (info) {
      const kitId = req.params.id;
      const infoOps = { where: { kitId: kitId } };
      KitInfo.destroy(infoOps);
      info = JSON.parse(info);
      info.forEach(i =>
        KitInfo.create({
          title: i.title,
          description: i.description,
          kitId: kitId,
        })
      );
    }

    if (related) {
      const kitId = req.params.id;
      const relatedOps = { where: { kitId: kitId } };
      KitRelated.destroy(relatedOps);
      related = JSON.parse(related);
      related.forEach(i =>
        KitRelated.create({
          referenceCode: i.referenceCode,
          kitId: kitId,
        })
      );
    }

    if (deletedSlideId) {
      deletedSlideId = JSON.parse(deletedSlideId);
      deletedSlideId.forEach(slideId => {
        const slideOps = { where: { id: slideId } };
        KitSlide.destroy(slideOps);
      });
    }

    if (slide) {
      const kitId = req.params.id;
      if (slide.length > 1) {
        slideNames.forEach(img => {
          KitSlide.create({
            slideImg: img,
            kitId: kitId,
          });
        });
      } else {
        KitSlide.create({
          slideImg: slideName,
          kitId: kitId,
        });
      }
    }

    return res.json(kit);
  }

  async getAll(req, res) {
    const { name } = req.query;

    let options = {
      distinct: true,
      where: {},
      include: [
        { model: KitRelated, as: 'related' },
        { model: KitInfo, as: 'info' },
        { model: KitSlide, as: 'slide' },
        { model: KitText, as: 'text' },
        { model: KitApplying, as: 'applying' },
        { model: KitCompound, as: 'compound' },
      ],
    };

    if (name) {
      options.where = { ...options.where, name: { [Op.iLike]: `%${name}%` } };
    }

    const kits = await Kit.findAll(options);

    return res.json(kits);
  }

  async getOne(req, res) {
    try {
      const { id } = req.params;
      const kit = await Kit.findOne({
        where: { id },
        include: [
          { model: KitRelated, as: 'related' },
          { model: KitInfo, as: 'info' },
          { model: KitSlide, as: 'slide' },
          { model: KitText, as: 'text' },
          { model: KitApplying, as: 'applying' },
          { model: KitCompound, as: 'compound' },
        ],
      });
      return res.json(kit);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }
}

module.exports = new KitController();
