import { createConnection, Connection, ConnectionOptions } from "typeorm";
import request from "supertest";
import app from "../src/app";
import { Server } from "http";
import { dbConfig } from "../dbConfig";
import { describe } from "node:test";

const PORT = process.env.TEST_PORT || 9000;
let connection: Connection;
let server: Server;
let authToken: string;

beforeAll(async () => {
  console.log("before All");
  connection = await createConnection(dbConfig as ConnectionOptions);
  await connection.synchronize();
  //console.log("connection ", connection);
  server = app.listen(PORT);
});

afterAll(async () => {
  console.log("after All");
  await connection.close();
  await server.close();
});

describe("Get /", () => {
  it("Server running or not", async () => {
    const res = await request(app).get("/");
    console.log("res is ", res.body);
  });
});

describe("POST /user/create", () => {
  it("POST /user/create, returns 400 status password not provided", async () => {
    const res = await request(app).post("/user/create").send({
      email: "johndoe@gmail.com",
    });

    expect(res.statusCode).toBe(400);
  });

  it("POST /user/create, returns 400 status email not provided", async () => {
    const res = await request(app).post("/user/create").send({
      password: "123456789",
    });

    expect(res.statusCode).toBe(400);
  });

  it("POST /user/create, returns 400 password length should be greater than 6", async () => {
    const res = await request(app).post("/user/create").send({
      email: "johndoe@gmail.com",
      password: "1234",
    });

    expect(res.statusCode).toBe(400);
  });

  it("POST /user/create, returns 200 status when user created successfully", async () => {
    const res = await request(app).post("/user/create").send({
      email: "johndoe@gmail.com",
      password: "123456789",
      firstName: "John",
      lastName: "Doe",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy(), expect(res.body.user).toBeTruthy();
  });

  it("POST /user/create, returns 409 status when user email already exists", async () => {
    const res = await request(app).post("/user/create").send({
      email: "johndoe@gmail.com",
      password: "123456789",
      firstName: "John",
      lastName: "Doe",
    });

    expect(res.statusCode).toBe(409);
  });
});

describe("POST /user/login", () => {
  it("POST /user/login, returns 400 status password not provided", async () => {
    const res = await request(app).post("/user/login").send({
      email: "johndoe@gmail.com",
    });

    expect(res.statusCode).toBe(400);
  });

  it("POST /user/login, returns 400 status email not provided", async () => {
    const res = await request(app).post("/user/login").send({
      password: "123456789",
    });

    expect(res.statusCode).toBe(400);
  });

  it("POST /user/login, returns 401 status email/password invalid", async () => {
    const res = await request(app).post("/user/login").send({
      email: "johndoe@gmails.com",
      password: "123456789",
    });

    expect(res.statusCode).toBe(401);
  });

  it("POST /user/login, returns 200 status when user successfully logged In", async () => {
    const res = await request(app).post("/user/login").send({
      email: "johndoe@gmail.com",
      password: "123456789",
    });

    console.log("result is ", res.body, res.statusCode);
    expect(res.statusCode).toBe(200);
    expect(res.body.token).not.toBeUndefined();
    authToken = res.body.token;
  });
});

describe("Get /user", () => {
  it("to get user details", async () => {
    if (!authToken) {
      fail("Auth Token not provided");
    }

    const result = await request(app)
      .get("/user")
      .set("Authorization", `Bearer ${authToken}`);
    console.log("result is ", result.body);
  });
});

describe("POST /user/forgot-password", () => {
  it("POST /user/forgot-password, returns 400 status email not provided", async () => {
    const res = await request(app).post("/user/forgot-password").send({});

    expect(res.statusCode).toBe(400);
  });

  it("POST /user/forgot-password, returns 404 status email invalid", async () => {
    const res = await request(app).post("/user/forgot-password").send({
      email: "johndoe@gmails.com",
    });

    expect(res.statusCode).toBe(404);
  });

  it("POST /user/forgot-password, returns 200 status when otp successfully sent to user email", async () => {
    const res = await request(app).post("/user/forgot-password").send({
      email: "johndoe@gmail.com",
    });

    console.log("result is ", res.body, res.statusCode);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy();
  });
});

describe("POST /user/reset-password", () => {
  it("POST /user/reset-password, returns 400 status email,otp or password not provided", async () => {
    const res = await request(app).post("/user/reset-password").send({
      email: "johndoe@gmail.com",
      otp: 123456,
      password: "",
    });

    expect(res.statusCode).toBe(400);
  });

  it("POST /user/reset-password, returns 400 otp incorrect/invalid", async () => {
    const res = await request(app).post("/user/reset-password").send({
      email: "johndoe@gmail.com",
      otp: 123456,
      newPassword: "newpassword",
    });

    expect(res.statusCode).toBe(400);
  });
});
