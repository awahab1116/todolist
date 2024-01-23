import * as dotenv from "dotenv";
import fileUpload from "express-fileupload";
import express from "express";
import "reflect-metadata";
import { pagination } from "typeorm-pagination";
// import cron from "node-cron";
// import sendEmailToUsersTasksDueTodayJob from "./helper/cronJob";
import usersRouter from "./routes/UserRoutes";
import taskRouter from "./routes/TaskRoutes";
import reportRouter from "./routes/ReportRoutes";
import facebookRouter from "./routes/FacebookRoutes";
import swaggerUI from "swagger-ui-express";
import YAML from "yamljs";
const swaggerJSDocs = YAML.load("./src/swaggerYaml/api.yaml");
import passport from "passport";
import FacebookStrategy from "passport-facebook";
import session from "express-session";

// Loads environment variables from a .env file into process.env
dotenv.config();

//Initializing express
const app = express();

app.use(
  session({
    secret: process.env.TOKEN_SECRET as string,
    resave: true,
    saveUninitialized: true,
  })
);

//Initializing passport and it's session
app.use(passport.initialize());
app.use(passport.session());

// Configures Passport to use Facebook authentication strategy
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

      return done(null, user);
    }
  )
);

// Passport serialization of user for session storage
passport.serializeUser((user: any, done) => {
  done(null, user);
});

// Passport deserialization of user from session storage
passport.deserializeUser((obj: any, done) => {
  done(null, obj);
});

// Parse URL-encoded data with extended options
app.use(express.urlencoded({ extended: true }));

// Parse JSON data
app.use(express.json());

// Serve Swagger API documentation at "/api-docs"
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerJSDocs));

// Middleware for handling file uploads with specified file size limit (50 MB)
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
  })
);

// Middleware for handling pagination
app.use(pagination);

// Define routes
app.use("/user", usersRouter);
app.use("/task", taskRouter);
app.use("/report", reportRouter);
app.use("/auth", facebookRouter);
app.get("/facebook/login-page", (_req, res) => {
  res.send(
    'Hello, please login with Facebook: <a href="/auth/facebook">Login</a>'
  );
});
app.get("/profile", (req, res) => {
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

//Cronjob commented it runs after every day 12AM
//e.g to run every */15 * * * * *  15 seconds
//if you want to run please uncomment it
// cron.schedule("0 0 * * *", sendEmailToUsersTasksDueTodayJob, {
//   scheduled: true,
//   timezone: process.env.NODE_CRON_JOB as string, // Pacific Time
// });

export default app;
