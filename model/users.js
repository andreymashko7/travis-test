const User = require("./schemas/user");

const findByEmail = async (email) => {
  return await User.findOne({ email });
};

const findById = async (id) => {
  return await User.findOne({ _id: id });
};

const findByVerifyToken = async (verificationToken) => {
  return await User.findOne({ verificationToken });
};

const create = async ({
  email,
  password,
  subscription,
  verify,
  verificationToken,
}) => {
  const user = new User({
    email,
    password,
    subscription,
    verify,
    verificationToken,
  });
  return await user.save();
};

const updateToken = async (id, token) => {
  return await User.updateOne({ _id: id }, { token });
};

const updateVerifyToken = async (id, verify, verificationToken) => {
  return await User.updateOne({ _id: id }, { verify, verificationToken });
};

const updateSubsription = async (id, subscription) => {
  return await User.updateOne({ _id: id }, { subscription });
};

const updateAvatar = async (id, avatarURL) => {
  return await User.updateOne({ _id: id }, { avatarURL });
};

module.exports = {
  findByEmail,
  findById,
  findByVerifyToken,
  create,
  updateToken,
  updateVerifyToken,
  updateSubsription,
  updateAvatar,
};
