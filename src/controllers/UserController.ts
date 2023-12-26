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

export const login = async (req: Request, res: Response) => {
  try {
    const email: string = req.body.email;
    const password: string = req.body.password;

    if (!IsEmailAddress(email) || !email.trim().length) {
      return RequestFailed(res, 400, "email");
    }

    if (!password || !password.trim().length) {
      return RequestFailed(res, 400, "password");
    }

    const user = await getConnection()
      .getRepository(User)
      .createQueryBuilder("user")
      .where("user.email = :email", { email })
      .getOne();

    if (!user) {
      return RequestFailed(res, 401, "Your email / password might be wrong.");
    } else {
      const isValidPass = await compare(password, user.password);
      if (!isValidPass) {
        return RequestFailed(res, 401, "You have entered a wrong password.");
      }
      if (!user.isActive) {
        return RequestFailed(res, 401, "Your account is not active.");
      }
      const data = {
        id: user.id,
        email: user.email,
      };
      const token = jwt.sign(data, process.env.TOKEN_SECRET!, {
        expiresIn: "7d",
      });

      const refreshToken = jwt.sign(data, process.env.REFRESH_TOKEN_SECRET!, {
        expiresIn: "30d",
      });
      if (token) {
        res.status(200).json(LoginResponse(token, refreshToken, user));
      }
    }
  } catch (error) {
    return InternalServerError(res, error);
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const email = req.body.email;

    if (!IsEmailAddress(email) || !email.trim().length) {
      return RequestFailed(res, 400, "email");
    }

    const user = await User.findOne({
      where: {
        email,
      },
    });

    if (user) {
      if (user.loginType !== loginType.simple) {
        return res.status(400).send({
          success: false,
          message:
            "You can't reset your password,if you registered through facebook",
        });
      }

      let otp = generateOtp();
      console.log("Otp is ", otp);

      const updatedUser = await getConnection()
        .createQueryBuilder()
        .update(User)
        .set(otp)
        .where("id = :id", { id: user.id })
        .execute();

      console.log("Updated User is ", updatedUser);

      if (updatedUser?.affected) {
        let mailDeatils = {
          to: user.email,
          subject: "Otp for forgot password",
          text: `Your otp is ${otp.otp}`,
        };

        await sendEmail(mailDeatils);

        return res.status(200).send({
          success: true,
          message: "Otp send to your email",
        });
      } else {
        return res.status(404).send({
          success: false,
          message: "Cannot send otp to user",
        });
      }
    } else {
      return RequestFailed(res, 400, "user");
    }
  } catch (error) {
    return InternalServerError(res, error);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const email = req.body.email;
    const otp = req.body.otp;
    const newPassword = req.body.newPassword;

    if (!(otp && newPassword && email)) {
      return RequestFailed(res, 400, "email,otp or password");
    }

    const user = await User.findOne({
      where: {
        email,
      },
    });

    if (user) {
      if (user.otp === otp) {
        console.log("time ", user.otpExpirationTime, new Date());
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

          console.log("Updated User is ", updatedUser);

          if (updatedUser?.affected) {
            return res.status(202).send({
              success: true,
              message: "Password updated successfully",
            });
          } else {
            return res.status(202).send({
              success: false,
              message: "Password not changed.Try again later",
            });
          }
        } else {
          return res.status(202).send({
            success: false,
            message: "Otp is expired",
          });
        }
      } else {
        return res.status(202).send({
          success: false,
          message: "Otp is invalid",
        });
      }
    } else {
      return RequestFailed(res, 400, "user");
    }
  } catch (error) {
    return InternalServerError(res, error);
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const email: string = req.body.email;
    const firstname: string = req.body.firstName;
    const lastname: string = req.body.lastName;
    const password: string = req.body.password;
    const profileImage: string = req.body.profileImage || "";

    if (!firstname || !firstname.trim().length) {
      return RequestFailed(res, 400, "firstname");
    }
    if (!lastname || !lastname.trim().length) {
      return RequestFailed(res, 400, "lastname");
    }
    if (!password || !password.trim().length) {
      return RequestFailed(res, 400, "password");
    }

    if (!IsEmailAddress(email) || !email.trim().length) {
      return RequestFailed(res, 400, "email");
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
    return InternalServerError(res, error);
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    //logger.info("in get user");
    console.log("in get user");
    const user = await User.findOne(req.userId);

    if (!user) {
      return RequestFailed(res, 404, "user", req.userId);
    }

    const plainUser = classToPlain(user);
    res.status(200).json({
      success: true,
      user: plainUser,
    });
  } catch (error) {
    return InternalServerError(res, error);
  }
};
