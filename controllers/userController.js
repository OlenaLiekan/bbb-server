const ApiError = require('../error/ApiError');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const {
  User,
  Basket,
  UserOrder,
  OrderItem,
  UserAddress,
  UserPromocode,
  PaymentInformation,
} = require('../models/models');

const generateJwt = (id, email, role) => {
  return jwt.sign({ id, email, role }, process.env.SECRET_KEY, {
    expiresIn: '24h',
  });
};

class UserController {
  async registration(req, res, next) {
    const { email, password, role, firstName, lastName, phone } = req.body;
    if (!email || !password) {
      return next(ApiError.badRequest('Invalid email or password'));
    }
    const candidate = await User.findOne({ where: { email } });
    if (candidate) {
      return next(ApiError.badRequest('User with this email is allready exist'));
    }
    const hashPassword = await bcrypt.hash(password, 5);
    const user = await User.create({
      email,
      role,
      password: hashPassword,
      firstName,
      lastName,
      phone,
    });
    const basket = await Basket.create({ userId: user.id });
    const token = generateJwt(user.id, user.email, user.role);
    return res.json({ token });
  }

  async login(req, res, next) {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return next(ApiError.internal('User not found'));
      }

      let comparePassword = bcrypt.compareSync(password, user.password);

      if (!comparePassword) {
        return next(ApiError.internal('Invalid password'));
      }

      const token = generateJwt(user.id, user.email, user.role);
      return res.json({ token });
    } catch (error) {
      console.log('error:', error);
    }
  }

  async refreshToken(req, res, next) {
    const token = generateJwt(req.user.id, req.user.email, req.user.role);
    return res.json({ token });
  }

  async getAll(req, res) {
    const { role } = req.query;
    let options = {
      where: {},
      include: [
        {
          model: UserOrder,
          as: 'order',
          include: [{ model: OrderItem, as: 'item' }],
        },
        {
          model: UserPromocode,
          as: 'promocode',
        },
      ],
    };
    if (role) {
      options.where = { ...options.where, role };
    }
    const users = await User.findAll(options);
    return res.json(users);
  }

  async getById(req, res) {
    try {
      const { id } = req.params;

      const userAgent = req.headers['user-agent'] || 'unknown';
      const ip = req.ip || req.connection.remoteAddress;

      const userId = parseInt(id);

      if (isNaN(userId)) {
        console.log(`🚨 BLOCKED BOT: IP=${ip}, ID="${id}", UA=${userAgent}, Path=${req.path}`);
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
      }

      console.log(
        `✅ Valid user request: IP=${ip}, UserID=${userId}, UA=${userAgent.substring(0, 30)}`
      );

      let options = {
        where: {},
        include: [
          { model: UserOrder, as: 'order', include: [{ model: OrderItem, as: 'item' }] },
          { model: UserPromocode, as: 'promocode' },
          {
            model: UserAddress,
            as: 'address',
          },
        ],
      };
      if (userId) {
        options.where = { ...options.where, id: userId };
      }
      const user = await User.findOne(options);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
      return res.json(user);
    } catch (error) {
      console.error('Error in user getById:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getOne(req, res) {
    const { email } = req.query;
    let options = {
      where: {},
      include: [
        { model: UserOrder, as: 'order', include: [{ model: OrderItem, as: 'item' }] },
        { model: UserPromocode, as: 'promocode' },
        {
          model: UserAddress,
          as: 'address',
        },
      ],
    };
    if (email) {
      options.where = { ...options.where, email };
    }
    const user = await User.findOne(options);
    return res.json(user);
  }

  async destroy(req, res) {
    const { id } = req.query;
    const user = await User.destroy({
      where: { id },
    });
    return res.json(user);
  }

  async update(req, res) {
    const { id } = req.params;
    let {
      userId,
      quantity,
      sum,
      deliveryPrice,
      orderNumber,
      items,
      firstName,
      upFirstName,
      crFirstName,
      lastName,
      upLastName,
      crLastName,
      email,
      upEmail,
      crEmail,
      phone,
      upPhone,
      crPhone,
      password,
      company,
      firstAddress,
      secondAddress,
      city,
      country,
      region,
      postalCode,
      userComment,
      mainAddress,
      deletedAddressId,
      updatedAddressId,
      promocode,
      orderId,
      promocodeName,
      promocodeValue,
      promocodeBrandId,
    } = req.body;

    let options = {
      where: { id: id },
    };

    let props = {};

    if (firstName) {
      props = { ...props, firstName };
    }

    if (lastName) {
      props = { ...props, lastName };
    }

    if (email) {
      props = { ...props, email };
    }

    if (phone) {
      props = { ...props, phone };
    }

    if (password) {
      const hashPassword = await bcrypt.hash(password, 5);
      props = { ...props, password: hashPassword };
    }

    const user = await User.update(props, options);

    if (userId && items) {
      const userOrder = await UserOrder.create({
        userId,
        quantity,
        deliveryPrice,
        sum,
        orderNumber,
        userComment,
        promocodeName,
        promocodeValue,
        promocodeBrandId,
      });
      items = JSON.parse(items);
      items.forEach(item => {
        OrderItem.create({
          title: item.name,
          description:
            'Marca: ' +
            item.company +
            '\nCódigo: ' +
            item.code +
            '\n' +
            (item.curlArr
              ? 'Opções: ' +
                item.curlArr +
                ' / ' +
                item.thicknessArr +
                ' / ' +
                item.lengthArr +
                '\n'
              : '') +
            (item.isLashes ? '' : item.info.map(obj => obj.title + ': ' + obj.description + '\n')) +
            'Preço: ' +
            item.price +
            ' €\n' +
            'Quantidade: ' +
            item.count,
          img: item.img,
          userOrderId: userOrder.id,
          brandId: item.brandId ? item.brandId : null,
          promocodeAllowed: item.exclusiveProduct || item.promoProduct ? false : true,
          prevPrice: item.prevPrice ? item.prevPrice : null,
        });
      });
    }

    if (userId && promocode) {
      UserPromocode.create({
        name: promocode,
        orderId,
        userId,
      });
    }

    if (userId && firstAddress && !updatedAddressId) {
      company = company ? company : '';
      secondAddress = secondAddress ? secondAddress : '';
      if (mainAddress) {
        const prevMainAddress = await UserAddress.findOne({
          where: {
            userId: userId,
            mainAddress: true,
          },
        });
        if (prevMainAddress) {
          let options = {
            where: { id: prevMainAddress.id },
          };
          let props = {};
          props = { ...props, mainAddress: false };
          await UserAddress.update(props, options);
        }
      }
      await UserAddress.create({
        userId,
        firstName: crFirstName,
        lastName: crLastName,
        email: crEmail,
        phone: crPhone,
        company: company,
        firstAddress,
        secondAddress: secondAddress,
        city,
        country,
        region,
        postalCode,
        mainAddress,
      });
    }

    if (userId && deletedAddressId) {
      UserAddress.destroy({
        where: { id: deletedAddressId },
      });
    }

    if (updatedAddressId) {
      if (mainAddress) {
        const prevMainAddress = await UserAddress.findOne({
          where: {
            userId: id,
            mainAddress: true,
          },
        });
        if (prevMainAddress.id !== updatedAddressId) {
          let options = {
            where: { id: prevMainAddress.id },
          };
          let props = {};
          props = { ...props, mainAddress: false };
          await UserAddress.update(props, options);
        }
      }

      let options = {
        where: { id: updatedAddressId },
      };
      let props = {};

      if (upFirstName) {
        props = { ...props, firstName: upFirstName };
      }
      if (upLastName) {
        props = { ...props, lastName: upLastName };
      }
      if (upEmail) {
        props = { ...props, email: upEmail };
      }
      if (upPhone) {
        props = { ...props, phone: upPhone };
      }
      if (company) {
        props = { ...props, company };
      }
      if (firstAddress) {
        props = { ...props, firstAddress };
      }
      if (secondAddress) {
        props = { ...props, secondAddress };
      }
      if (city) {
        props = { ...props, city };
      }
      if (country) {
        props = { ...props, country };
      }
      if (region) {
        props = { ...props, region };
      }
      if (postalCode) {
        props = { ...props, postalCode };
      }

      props = { ...props, mainAddress };
      await UserAddress.update(props, options);
    }
    return res.json(user);
  }
}

module.exports = new UserController();
