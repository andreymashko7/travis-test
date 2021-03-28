const jwt = require("jsonwebtoken");
const Users = require("../model/users");
const fs = require("fs").promises;
const path = require("path");
const Jimp = require("jimp");
const { nanoid } = require("nanoid");
const { HttpCode, Status } = require("../helpers/constants");

const createFolderIsExist = require("../helpers/create-dir");
const EmailService = require("../services/email");

const SECRET_KEY = process.env.JWT_SECRET;
require("dotenv").config();

const reg = async (req, res, next) => {
  try {
    const { email, name } = req.body;
    const user = await Users.findByEmail(email);
    if (user) {
      return res.status(HttpCode.CONFLICT).json({
        status: Status.ERROR,
        code: HttpCode.CONFLICT,
        data: "Conflict",
        message: "Email is already use",
      });
    }
    const verificationToken = nanoid();
    const emailService = new EmailService(process.env.NODE_ENV);
    await emailService.sendEmail(verificationToken, email, name);
    const newUser = await Users.create({
      ...req.body,
      verify: false,
      verificationToken,
    });
    return res.status(HttpCode.CREATED).json({
      status: Status.SUCCESS,
      code: HttpCode.CREATED,
      data: {
        id: newUser.id,
        email: newUser.email,
        avatarURL: newUser.avatarURL,
      },
    });
  } catch (e) {
    next(e);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await Users.findByEmail(email);
    const isValidPassword = await user?.validPassword(password);
    if (!user || !isValidPassword) {
      return res.status(HttpCode.UNAUTHORIZED).json({
        status: Status.ERROR,
        code: HttpCode.UNAUTHORIZED,
        data: "Unauthorized",
        message: "Invalid credentials",
      });
    }
    if (!user.verify) {
      return res.status(HttpCode.UNAUTHORIZED).json({
        status: Status.ERROR,
        code: HttpCode.UNAUTHORIZED,
        message: "email not verified",
      });
    }

    const id = user._id;
    const payload = { id };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "365d" });
    await Users.updateToken(id, token);
    return res.status(HttpCode.OK).json({
      status: Status.SUCCESS,
      code: HttpCode.OK,
      data: {
        token,
      },
    });
  } catch (e) {
    next(e);
  }
};

const logout = async (req, res, next) => {
  const id = req.user.id;
  await Users.updateToken(id, null);
  return res.status(HttpCode.NO_CONTENT).json({
    message: "Nothing",
  });
};

const current = async (req, res, next) => {
  try {
    return res.status(HttpCode.OK).json({
      status: Status.SUCCESS,
      code: HttpCode.OK,
      data: {
        id: req.user.id,
        email: req.user.email,
        subscription: req.user.subscription,
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateSubsription = async (req, res, next) => {
  try {
    const id = req.user.id;
    const subscription = req.body.subscription;
    await Users.updateSubsription(id, subscription);
    return res.status(HttpCode.OK).json({
      status: Status.SUCCESS,
      code: HttpCode.OK,
      data: {
        id: req.user.id,
        email: req.user.email,
        subscription,
      },
    });
  } catch (err) {
    next(err);
  }
};

const avatars = async (req, res, next) => {
  try {
    const id = req.user.id;
    const avatarUrl = await saveAvatarToStatic(req);
    await Users.updateAvatar(id, avatarUrl);
    return res.status(HttpCode.OK).json({
      status: Status.SUCCESS,
      code: HttpCode.OK,
      data: {
        avatarUrl,
      },
    });
  } catch (e) {
    next(e);
  }
};

const saveAvatarToStatic = async (req) => {
  const id = req.user.id;
  const PUBLIC_DIR = process.env.PUBLIC_DIR;
  const AVATARS_OF_USERS = path.join(PUBLIC_DIR, process.env.AVATARS_OF_USERS);

  const pathFile = req.file.path;
  const newNameAvatar = `${Date.now()}-${req.file.originalname}`;
  const img = await Jimp.read(pathFile);
  await img
    .autocrop()
    .cover(250, 250, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE)
    .writeAsync(pathFile);
  await createFolderIsExist(path.join(AVATARS_OF_USERS, id));
  await fs.rename(pathFile, path.join(AVATARS_OF_USERS, id, newNameAvatar));
  const avatarUrl = path.normalize(path.join(id, newNameAvatar));
  try {
    await fs.unlink(
      path.join(process.cwd(), AVATARS_OF_USERS, req.user.avatarURL)
    );
  } catch (e) {
    console.log(e.message);
  }
  return avatarUrl;
};

const verify = async (req, res, next) => {
  try {
    const user = await Users.findByVerifyToken(req.params.verificationToken);
    if (user) {
      await Users.updateVerifyToken(user.id, true, null);
      return res.status(HttpCode.OK).json({
        status: Status.SUCCESS,
        code: HttpCode.OK,
        message: "Verification successful",
      });
    }
    return res.status(HttpCode.NOT_FOUND).json({
      status: Status.ERROR,
      code: HttpCode.NOT_FOUND,
      data: "Not found",
      message: "Link not valid",
    });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  reg,
  login,
  logout,
  current,
  updateSubsription,
  avatars,
  verify,
};
