import { AppDataSource } from "../src/dataSource";
import { DataSource } from "typeorm";
import request from "supertest";
import app from "../src/app";
import { Server } from "http";
import { describe } from "node:test";

const PORT = process.env.PORT || 9000;
let connection: DataSource;
let server: Server;
let authToken: string;

beforeAll(async () => {
  connection = await AppDataSource;
  await connection.initialize();
  server = app.listen(PORT);
});

afterAll(async () => {
  await connection.destroy();
  await server.close();
});

describe("Get /", () => {
  it("Server running or not", async () => {
    await request(app).get("/");
  });
  it("POST /user/login, returns 200 status when user successfully logged In", async () => {
    const res = await request(app).post("/user/login").send({
      email: "johndoe@gmail.com",
      password: "123456789",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).not.toBeUndefined();
    authToken = res.body.token;
  });
});

describe("GET /report all report operations", () => {
  it("GET /report/tasks-summary User can get its task summary", async () => {
    const res = await request(app)
      .get("/report/tasks-summary")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
  });
  it("GET /report/not-completed-task-on-time user can get count of tasks which were not completed on time", async () => {
    const res = await request(app)
      .get("/report/not-completed-task-on-time")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
  });
  it("GET /report/user-completed-tasks-avg average number of tasks completed since creation of user", async () => {
    const res = await request(app)
      .get("/report/user-completed-tasks-avg")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
  });
  it("GET /report/max-tasks-completed the date on which user completed the maximum number of tasks", async () => {
    const res = await request(app)
      .get("/report/max-tasks-completed")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
  });
  it("GET /report/count-task-week number of tasks created on every day of week", async () => {
    const res = await request(app)
      .get("/report/count-task-week")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
  });
});
