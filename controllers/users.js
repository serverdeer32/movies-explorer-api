const { HTTP_STATUS_OK, HTTP_STATUS_CREATED } = require('http2').constants;
const { DocumentNotFoundError, ValidationError } = require('mongoose').Error;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { SECRET_KEY = 'mega-secretniy-key' } = process.env;
const User = require('../models/user');
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');

module.exports.editUserData = (req, res, next) => {
  const { name, email } = req.body;
  User.findByIdAndUpdate(req.user._id, { name, email }, { new: 'true', runValidators: true })
    .orFail()
    .then((user) => res.status(HTTP_STATUS_OK).send(user))
    .catch((err) => {
      if (err.code === 11000) {
        next(new ConflictError(`Пользователь с email ${email} уже зарегистрирован`));
      } else if (err instanceof ValidationError) {
        next(new BadRequestError(err.message));
      } else if (err instanceof DocumentNotFoundError) {
        next(new NotFoundError(`Пользователь с указанным id ${req.user._id} не найден`));
      } else {
        next(err);
      }
    });
};

module.exports.addUser = (req, res, next) => {
  const { name, email, password } = req.body;
  bcrypt.hash(password, 10)
    .then((hash) => User.create({
      name, email, password: hash,
    })
      .then((user) => res.status(HTTP_STATUS_CREATED).send({
        name: user.name, _id: user._id, email: user.email,
      }))
      .catch((err) => {
        if (err.code === 11000) {
          next(new ConflictError(`Пользователь с email ${email} уже зарегистрирован`));
        } else if (err instanceof ValidationError) {
          next(new BadRequestError(err.message));
        } else {
          next(err);
        }
      }));
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;
  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign({ _id: user._id }, SECRET_KEY, { expiresIn: '7d' });
      res.send({ token });
    })
    .catch((err) => {
      next(err);
    });
};

module.exports.getMeUser = (req, res, next) => {
  User.findById(req.user._id)
    .then((users) => res.status(HTTP_STATUS_OK).send(users))
    .catch(next);
};
