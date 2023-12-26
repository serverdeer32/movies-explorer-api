
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const UnauthorizedError = require('../errors/UnauthorizedError');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: [2, 'Минимальная длина имени пользователя - 2 символа'],
    maxlength: [30, 'Максимальная длина имени пользователя - 30 символов'],
    required: [true, 'Поле «Имя» должно быть заполнено'],
  },
  email: {
    type: String,
    required: [true, 'Поле «E-Mail» должно быть заполнено'],
    unique: true,
    validate: {
      validator: (email) => validator.isEmail(email),
      message: () => 'Введите корректный E-Mail',
    },
  },
  password: {
    type: String,
    required: [true, 'Поле «Пароль» должно быть заполнено'],
    select: false,
  },
}, { versionKey: false });

userSchema.statics.findUserByCredentials = async function findUserByCredentials(email, password) {
  return this.findOne({ email })
    .select('+password')
    .then((user) => {
      if (!user) {
        throw new UnauthorizedError('Неверные e-mail или пароль');
      }
      return bcrypt.compare(password, user.password)
        .then((matched) => {
          if (!matched) {
            throw new UnauthorizedError('Неверные e-mail или пароль');
          }
          return user;
        });
    });
};

module.exports = mongoose.model('user', userSchema);