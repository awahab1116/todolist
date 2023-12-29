import * as express from "express";
import passport from "passport";
import { User } from "../entity/User";
import jwt from "jsonwebtoken";
import { RequestFailed } from "../response/RequestFailedResponse";
import { InternalServerError } from "../response/InternalServerErrorResponse";
import { IsEmailAddress } from "../helper/IsEmailAddress";
import { loginType } from "../types/loginType";
import { FacebookRequest } from "../middlewares/AuthRequestContext";

//Initializing Express router
let router = express.Router();

//Function to create token for facebook login user
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

// Route for initiating Facebook authentication
router.get("/facebook", passport.authenticate("facebook"));

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/failed" }),
  async (req: FacebookRequest, res) => {
    try {
      let email = req?.user?.email as string;
      let displayName = req?.user?.displayName;

      //Checking if email is valid
      if (!IsEmailAddress(email) || !email.trim().length) {
        return RequestFailed(res, 400, "email");
      }

      let user = await User.findOne({
        where: {
          email,
        },
      });

      if (user) {
        //If in this block means old user which has previously loggedIn using facebook OAuth
        let generatedToken = generateToken(user);
        return res.status(200).send({
          token: generatedToken.token,
          refreshToken: generatedToken.refreshToken,
          user,
        });
      } else {
        //New user so we first make its account and then provide token for login
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
