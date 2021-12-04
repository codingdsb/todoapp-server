const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../constants");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  todos: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Todo",
      },
    ],
  },
});

UserSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, JWT_SECRET);
  return token;
};

module.exports = mongoose.model("User", UserSchema);
