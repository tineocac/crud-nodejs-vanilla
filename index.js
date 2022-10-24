const path = require("path");
const http = require("http");
const fs = require("fs/promises");

const PORT = 8000;

const modifyFile = async (jsonPath, arr) => {
  await fs.writeFile(jsonPath, JSON.stringify(arr));
};

const server = http.createServer(async (request, response) => {
  const url = request.url;
  const method = request.method;
  const jsonPath = path.resolve("./data.json");
  const jsonFile = await fs.readFile(jsonPath, "utf8");

  let arr = JSON.parse(jsonFile);

  if (url === "/apiv1/users/" && method === "GET") {
    response.setHeader("Content-Type", "application/json");
    response.writeHead(200);
    response.write(jsonFile);
  }

  if (url === "/apiv1/users/" && method === "POST") {
    request.on("data", async (data) => {
      arr = arr.sort((a, b) => a.id - b.id);
      const id = arr[arr.length - 1].id;
      const newUser = JSON.parse(data);
      newUser.id = id + 1;
      arr.push(newUser);
      await modifyFile(jsonPath, arr);
    });

    response.setHeader("Content-Type", "application/json");
  }

  if (url.includes("apiv1/user/") && method === "PUT") {
    const endPoint = url.split("/");
    const id = Number(endPoint[endPoint.length - 1]);

    request.on("data", async (data) => {
      data = JSON.parse(data);
      const updateData = arr.map((user) => {
        if (user.id === id) {
          user.status = data.status;
        }
        return user;
      });
      await modifyFile(jsonPath, updateData);
    });
    response.setHeader("Content-Type", "application/json");
    response.writeHead(201);
  }
  if (url.includes("apiv1/user/") && method === "DELETE") {
    const endPoint = url.split("/");
    const id = Number(endPoint[endPoint.length - 1]);
    const deleteUser = arr.filter((user) => user.id !== id);
    await modifyFile(jsonPath, deleteUser);
  }

  if (url !== "/apiv1/users" && !url.includes("/apiv1/user")) {
    const error = response.writeHead(503);
    response.end(
      `<h1>Error ${error.statusCode}</h1> <h1>Lo sentimos, pagina no encontrada</h1>`
    );
  }

  response.end();
});

server.listen(PORT);
