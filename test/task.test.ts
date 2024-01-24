import { AppDataSource } from "../src/dataSource";
import { DataSource } from "typeorm";
import request from "supertest";
import app from "../src/app";
import path from "path";
import { Server } from "http";
import { describe } from "node:test";
import { Task } from "../src/entity/Task";

const PORT = process.env.PORT || 9000;
let connection: DataSource;
let server: Server;
let authToken: string;
let task: Task;

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

describe("POST /task/create", () => {
  it("POST /task/create, returns 400 status if title not provided", async () => {
    const res = await request(app)
      .post("/task/create")
      .set("Authorization", `Bearer ${authToken}`)
      .set("Content-Type", "multipart/form-data")
      .field("description", "jest description")
      .field("dueDateTime", "2024-11-16T10:42:28")
      .attach("fileAttachments", path.resolve(__dirname, "../Images/pic.jpg"));

    expect(res.statusCode).toBe(400);
  });

  it("POST /task/create, returns 400 status if dueDate not provided", async () => {
    const res = await request(app)
      .post("/task/create")
      .set("Authorization", `Bearer ${authToken}`)
      .set("Content-Type", "multipart/form-data")
      .field("title", "jest title")
      .field("description", "jest description")
      .attach("fileAttachments", path.resolve(__dirname, "../Images/pic.jpg"));

    expect(res.statusCode).toBe(400);
  });

  it("POST /task/create, returns 400 status if dueDate invalid", async () => {
    const res = await request(app)
      .post("/task/create")
      .set("Authorization", `Bearer ${authToken}`)
      .set("Content-Type", "multipart/form-data")
      .field("title", "jest title")
      .field("dueDateTime", "2024-1-16 10:42:28")
      .field("description", "jest description")
      .attach("fileAttachments", path.resolve(__dirname, "../Images/pic.jpg"));

    expect(res.statusCode).toBe(400);
  });

  it("POST /task/create, returns 200 status if task created", async () => {
    const res = await request(app)
      .post("/task/create")
      .set("Authorization", `Bearer ${authToken}`)
      .set("Content-Type", "multipart/form-data")
      .field("title", "jest title")
      .field("description", "jest description")
      .field("dueDateTime", "2024-11-16T10:42:28")
      .attach("fileAttachments", path.resolve(__dirname, "../Images/pic.jpg"));

    await request(app)
      .post("/task/create")
      .set("Authorization", `Bearer ${authToken}`)
      .set("Content-Type", "multipart/form-data")
      .field("title", "jest title 1")
      .field("description", "jest description")
      .field("dueDateTime", "2024-11-16T10:42:28")
      .attach("fileAttachments", path.resolve(__dirname, "../Images/pic.jpg"));

    await request(app)
      .post("/task/create")
      .set("Authorization", `Bearer ${authToken}`)
      .set("Content-Type", "multipart/form-data")
      .field("title", "jest title")
      .field("description", "jest description")
      .field("dueDateTime", "2024-11-16T10:42:28")
      .attach("fileAttachments", path.resolve(__dirname, "../Images/pic.jpg"));

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBeTruthy(), expect(res.body.task).toBeTruthy();
    task = res.body.task;
  });
});

describe("PUT /task/edit", () => {
  it("PUT /task/edit user can edit its task by using taskId", async () => {
    const res = await request(app)
      .put(`/task/edit?taskId=${task.id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "updated title jest",
      });

    expect(res.statusCode).toBe(200);
  });

  it("PUT /task/edit invalid taskId", async () => {
    //tasId invalid or some other user tasId
    const res = await request(app)
      .put(`/task/edit?taskId=1122`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "updated title jest",
      });

    expect(res.statusCode).toBe(400);
  });

  it("PUT /task/edit taskId not provided", async () => {
    //tasId invalid or some other user tasId
    const res = await request(app)
      .put(`/task/edit?taskId=`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "updated title jest",
      });

    expect(res.statusCode).toBe(404);
  });
});

describe("GET /task/view", () => {
  it("GET /task/view user can view it's task", async () => {
    const res = await request(app)
      .get(`/task/view`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
  });
});

describe("POST /task/attach-file-to-task", () => {
  it("POST /task/attach-file-to-task user can attach files to a existing task", async () => {
    const res = await request(app)
      .post(`/task/attach-file-to-task?taskId=${task.id}`)
      .set("Content-Type", "multipart/form-data")
      .set("Authorization", `Bearer ${authToken}`)
      .attach("fileAttachments", path.resolve(__dirname, "../Images/pic.jpg"))
      .attach("fileAttachments", path.resolve(__dirname, "../Images/pic1.jpg"));

    expect(res.statusCode).toBe(200);
  });
  it("POST /task/attach-file-to-task invalid taskId", async () => {
    //tasId invalid or some other user tasId
    const res = await request(app)
      .post(`/task/attach-file-to-task?taskId=1122`)
      .set("Content-Type", "multipart/form-data")
      .set("Authorization", `Bearer ${authToken}`)
      .attach("fileAttachments", path.resolve(__dirname, "../Images/pic.jpg"))
      .attach("fileAttachments", path.resolve(__dirname, "../Images/pic1.jpg"));

    expect(res.statusCode).toBe(400);
  });
  it("POST /task/attach-file-to-task taskId not provided", async () => {
    //tasId invalid or some other user tasId
    const res = await request(app)
      .post(`/task/attach-file-to-task?taskId=`)
      .set("Content-Type", "multipart/form-data")
      .set("Authorization", `Bearer ${authToken}`)
      .attach("fileAttachments", path.resolve(__dirname, "../Images/pic.jpg"))
      .attach("fileAttachments", path.resolve(__dirname, "../Images/pic1.jpg"));

    expect(res.statusCode).toBe(404);
  });
});

describe("Get /task/download-file", () => {
  it("Get /task/download-file user can download files of a task", async () => {
    const res = await request(app)
      .get(`/task/download-file?taskId=${task.id}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.headers["content-type"]).toEqual("application/zip");
  });
  it("Get /task/download-file invalid taskId", async () => {
    //tasId invalid or some other user tasId
    const res = await request(app)
      .get(`/task/download-file?taskId=1122`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(400);
  });
  it("Get /task/download-file taskId not provided", async () => {
    //tasId invalid or some other user tasId
    const res = await request(app)
      .get(`/task/download-file?taskId=`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(400);
  });
});

describe("GET /task/similar-tasks", () => {
  it("GET /task/similar-tasks user can view it's similar task", async () => {
    const res = await request(app)
      .get(`/task/similar-tasks`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
  });
});

// describe("DELETE /task/delete", () => {
//   it("DELETE /task/delete invalid taskId", async () => {
//     //tasId invalid or some other user tasId
//     const res = await request(app)
//       .delete(`/task/delete?taskId=1122`)
//       .set("Authorization", `Bearer ${authToken}`);

//     expect(res.statusCode).toBe(400);
//   });

//   it("DELETE /task/delete taskId not provided", async () => {
//     //tasId invalid or some other user tasId
//     const res = await request(app)
//       .delete(`/task/delete?taskId=`)
//       .set("Authorization", `Bearer ${authToken}`);

//     expect(res.statusCode).toBe(404);
//   });

//   it("DELETE /task/delete user can delete its task by using taskId", async () => {
//     const res = await request(app)
//       .delete(`/task/delete?taskId=${task.id}`)
//       .set("Authorization", `Bearer ${authToken}`);

//     expect(res.statusCode).toBe(200);
//   });
// });
