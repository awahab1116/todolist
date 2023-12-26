import * as dotenv from "dotenv";
import fileUpload from "express-fileupload";
import express from "express";
import "reflect-metadata";
import { createConnection } from "typeorm";
import { pagination } from "typeorm-pagination";
// import cron from "node-cron";
// import sendEmailToUsersTasksDueTodayJob from "./helper/cronJob";
import usersRouter from "./routes/UserRoutes";
import taskRouter from "./routes/TaskRoutes";
import reportRouter from "./routes/ReportRoutes";
import facebookRouter from "./routes/FacebookRoutes";
import logger from "./Logger";
import swaggerUI from "swagger-ui-express";
import YAML from "yamljs";
const swaggerJSDocs = YAML.load("./src/swaggerYaml/api.yaml");
import passport from "passport";
import FacebookStrategy from "passport-facebook";
import session from "express-session";

dotenv.config();

const PORT = process.env.PORT || 9000;

const app = express();
app.use(
  session({ secret: "your-secret-key", resave: true, saveUninitialized: true })
);
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new FacebookStrategy.Strategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL as string,
      profileFields: ["id", "displayName", "emails"],
    },
    (_accessToken, _refreshToken, profile, done) => {
      const user = {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails ? profile.emails[0].value : null,
      };
      console.log("User is ", user);

      return done(null, user);
    }
  )
);
passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((obj: any, done) => {
  done(null, obj);
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerJSDocs));
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
  })
);

app.use(pagination);

app.use("/user", usersRouter);
app.use("/task", taskRouter);
app.use("/report", reportRouter);
app.use("/auth", facebookRouter);

// Define routes
app.get("/facebook/login-page", (_req, res) => {
  res.send(
    'Hello, please login with Facebook: <a href="/auth/facebook">Login</a>'
  );
});

app.get("/profile", (req, res) => {
  console.log("Req is ", req.user);
  if (req.isAuthenticated()) {
    res.send(`<h1>Hello, ${req?.user}</h1><a href="/logout">Logout</a>`);
  } else {
    res.redirect("/failed");
  }
});

app.get("/failed", (_, res) => {
  res.status(200).json({
    success: false,
    message: "failed facebook ",
  });
});

app.get("/", (_, res) => {
  res.status(200).json({
    success: true,
    message: "TodoList Application",
  });
});

//Cronjob commented it runs after every 15 seconds for testing
// cron.schedule("*/15 * * * * *", sendEmailToUsersTasksDueTodayJob, {
//   scheduled: true,
//   timezone: "Asia/Karachi",
// });

createConnection()
  .then(async () => {
    app.listen(PORT, () => {
      console.log(`CONNECTED TO DB AND SERVER STARTED ON PORT  ${PORT}`);
      logger!.info(`CONNECTED TO DB AND SERVER STARTED ON PORT  ${PORT}`);
    });
  })
  .catch((error) => logger!.error("Cannot connect", error));
