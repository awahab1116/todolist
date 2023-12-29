import { compare, hash } from "bcryptjs";
import { classToPlain } from "class-transformer";
import { Request, Response } from "express";
import { User } from "../entity/User";
import { InternalServerError } from "../response/InternalServerErrorResponse";
import { RequestFailed } from "../response/RequestFailedResponse";
import { getConnection } from "typeorm";
import { AuthRequest } from "../middlewares/AuthRequestContext";
import { LoginResponse } from "../response/LoginResponse";
import jwt from "jsonwebtoken";
import { IsEmailAddress } from "../helper/IsEmailAddress";
import { generateOtp } from "../helper/otp";
import sendEmail from "../helper/nodemailer";
import { loginType } from "../types/loginType";
import logger from "../Logger";

export const login = async (req: Request, res: Response) => {
  try {
    //logging the data to terminal
    logger!.info(req.originalUrl, req.body);

    //Variables to be used in function
    const email: string = req.body.email;
    const password: string = req.body.password;

    //Is email valid and provided by user
    if (!IsEmailAddress(email) || !email.trim().length) {
      return RequestFailed(
        res,
        400,
        `Email cannot be null/Invalid`,
        req.originalUrl,
        req.body
      );
    }

    //is password provided
    if (!password || !password.trim().length) {
      return RequestFailed(
        res,
        400,
        `Password cannot be null/Invalid`,
        req.originalUrl,
        req.body
      );
    }

    //To get user from a database
    const user = await getConnection()
      .getRepository(User)
      .createQueryBuilder("user")
      .where("user.email = :email", { email })
      .getOne();

    //if user not found then user provided invalid credentials
    if (!user) {
      return RequestFailed(
        res,
        401,
        `Your email / password might be wrong.`,
        req.originalUrl,
        req.body
      );
    } else {
      //if in this block user found
      //now checking if user provided correct password
      const isValidPass = await compare(password, user.password);
      //if invalid password
      if (!isValidPass) {
        return RequestFailed(
          res,
          401,
          `You have entered a wrong password.`,
          req.originalUrl,
          req.body
        );
      }
      //if user account is not active
      if (!user.isActive) {
        return RequestFailed(
          res,
          401,
          `Your account is not active.`,
          req.originalUrl,
          req.body
        );
      }
      const data = {
        id: user.id,
        email: user.email,
      };

      //creating a access token
      const token = jwt.sign(data, process.env.TOKEN_SECRET!, {
        expiresIn: "7d",
      });

      //creating a refresh token rightnow not used in this project
      const refreshToken = jwt.sign(data, process.env.REFRESH_TOKEN_SECRET!, {
        expiresIn: "30d",
      });
      if (token) {
        res.status(200).json(LoginResponse(token, refreshToken, user));
      }
    }
  } catch (error) {
    return InternalServerError(res, error, req.originalUrl);
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    //logging the data to terminal
    logger!.info(req.originalUrl, req.body);

    //Variables to be used in function
    const email = req.body.email;

    //Is email valid and provided by user
    if (!IsEmailAddress(email) || !email.trim().length) {
      return RequestFailed(
        res,
        400,
        "Email cannot be null/Invalid",
        req.originalUrl,
        req.body
      );
    }

    const user = await User.findOne({
      where: {
        email,
      },
    });

    //if user found
    if (user) {
      //check for only those users who used facebook as their signup theu can reset password
      if (user.loginType !== loginType.simple) {
        return RequestFailed(
          res,
          400,
          "You can't reset your password,if you registered through facebook",
          req.originalUrl,
          req.body
        );
      }

      //to generate otp
      let otp = generateOtp();

      //updating the user with otp and expiration time of otp
      const updatedUser = await getConnection()
        .createQueryBuilder()
        .update(User)
        .set(otp)
        .where("id = :id", { id: user.id })
        .execute();

      //checking if user updated or not
      if (updatedUser?.affected) {
        let mailDeatils = {
          to: user.email,
          subject: "Otp for forgot password",
          text: `Your otp is ${otp.otp}`,
        };

        //sending email to user with otp
        await sendEmail(mailDeatils);

        return res.status(200).send({
          success: true,
          message: "Otp send to your email",
        });
      } else {
        return RequestFailed(
          res,
          404,
          "Cannot send otp to user",
          req.originalUrl,
          req.body
        );
      }
    } else {
      return RequestFailed(
        res,
        404,
        "User email not found.",
        req.originalUrl,
        req.body
      );
    }
  } catch (error) {
    return InternalServerError(res, error, req.originalUrl);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    logger!.info(req.originalUrl, req.body);
    const email = req.body.email;
    const otp = req.body.otp;
    const newPassword = req.body.newPassword;

    //checking if all 3 required parameters are provided
    if ((!otp && otp !== 0) || !newPassword || !email) {
      return RequestFailed(
        res,
        400,
        "email,otp or password not provided",
        req.originalUrl,
        req.body
      );
    }

    //is email valid
    if (!IsEmailAddress(email) || !email.trim().length) {
      return RequestFailed(
        res,
        400,
        "Email cannot be Invalid",
        req.originalUrl,
        req.body
      );
    }

    //password should be greater than 6 characters
    if (newPassword.length <= 6) {
      return RequestFailed(
        res,
        400,
        "Password length should be greater than 6",
        req.originalUrl,
        req.body
      );
    }

    const user = await User.findOne({
      where: {
        email,
      },
    });

    if (user) {
      //check if user provided correct otp
      if (user.otp === otp) {
        //check if otp is expired or not
        if (user.otpExpirationTime > new Date()) {
          const hashPassword = await hash(newPassword, 12);

          const updatedUser = await getConnection()
            .createQueryBuilder()
            .update(User)
            .set({
              password: hashPassword,
            })
            .where("id = :id", { id: user.id })
            .execute();

          if (updatedUser?.affected) {
            return res.status(200).send({
              success: true,
              message: "Password updated successfully",
            });
          } else {
            return RequestFailed(
              res,
              200,
              "Password not changed.Try again later",
              req.originalUrl,
              req.body
            );
          }
        } else {
          return RequestFailed(
            res,
            400,
            "Otp is expired",
            req.originalUrl,
            req.body
          );
        }
      } else {
        return RequestFailed(
          res,
          400,
          "Otp is invalid",
          req.originalUrl,
          req.body
        );
      }
    } else {
      return RequestFailed(
        res,
        400,
        "User not found",
        req.originalUrl,
        req.body
      );
    }
  } catch (error) {
    return InternalServerError(res, error, req.originalUrl);
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    logger!.info(req.originalUrl, req.body);
    const email: string = req.body.email;
    const firstname: string = req.body.firstName || "";
    const lastname: string = req.body.lastName || "";
    const password: string = req.body.password;
    const profileImage: string = req.body.profileImage || "";

    if (!password || !password.trim().length) {
      return RequestFailed(
        res,
        400,
        "Password cannot be null/Invalid",
        req.originalUrl,
        req.body
      );
    }

    if (!IsEmailAddress(email) || !email.trim().length) {
      return RequestFailed(
        res,
        400,
        "Email cannot be null/Invalid",
        req.originalUrl,
        req.body
      );
    }

    if (password.length <= 6) {
      return RequestFailed(
        res,
        400,
        "Password length should be greater than 6",
        req.originalUrl,
        req.body
      );
    }

    const hashPassword = await hash(password, 12);

    const user = new User();
    user.email = email;
    user.firstName = firstname;
    user.lastName = lastname;
    user.password = hashPassword;
    user.profileImage = profileImage;
    user.createdAt = new Date();
    user.updatedAt = new Date();
    await user.save();

    const userResponse = classToPlain(user);
    res.status(200).json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    return InternalServerError(res, error, req.originalUrl);
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    logger!.info(req.originalUrl, { userId: req.userId });
    const user = await User.findOne(req.userId);

    if (!user) {
      return RequestFailed(res, 404, "User not found", req.originalUrl, {
        userId: req.userId,
      });
    }

    const plainUser = classToPlain(user);
    return res.status(200).send({
      success: true,
      user: plainUser,
    });
  } catch (error) {
    return InternalServerError(res, error, req.originalUrl);
  }
};
