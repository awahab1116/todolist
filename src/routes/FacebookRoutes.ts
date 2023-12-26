import * as express from "express";
import passport from "passport";
import { User } from "../entity/User";
import jwt from "jsonwebtoken";
import { RequestFailed } from "../response/RequestFailedResponse";
import { InternalServerError } from "../response/InternalServerErrorResponse";
import { IsEmailAddress } from "../helper/IsEmailAddress";
import { loginType } from "../types/loginType";
import { FacebookRequest } from "../middlewares/AuthRequestContext";

let router = express.Router();

const generateToken = (user: User) => {
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
  return {
    token,
    refreshToken,
  };
};

router.get("/facebook", passport.authenticate("facebook"));

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/failed" }),
  async (req: FacebookRequest, res) => {
    try {
      let email = req?.user?.email as string;
      let displayName = req?.user?.displayName;
      console.log("Hello");

      if (!IsEmailAddress(email) || !email.trim().length) {
        return RequestFailed(res, 400, "email");
      }

      let user = await User.findOne({
        where: {
          email,
        },
      });
      console.log("User is ", user);
      if (user) {
        console.log("old user ");
        let generatedToken = generateToken(user);
        console.log("Token is ", generatedToken.token);
        return res.status(200).send({
          token: generatedToken.token,
          refreshToken: generatedToken.refreshToken,
          user,
        });
      } else {
        console.log("New user");
        const newUser = new User();
        newUser.email = email;
        newUser.firstName = displayName ? displayName : "";
        newUser.loginType = loginType.facebook;
        newUser.createdAt = new Date();
        newUser.updatedAt = new Date();
        await newUser.save();
        let generatedToken = generateToken(newUser);
        return res.status(200).send({
          token: generatedToken.token,
          refreshToken: generatedToken.refreshToken,
          newUser,
        });
      }
    } catch (error) {
      return InternalServerError(res, error);
    }
  }
);

export = router;
