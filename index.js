const socketIO = require("socket.io");
const http = require("http");
const express = require("express");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

require("dotenv").config({ path: "./.env" });

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("hello world");
});

let users = [];

const addUser = (userId, socketId) => {
  // Check if user already exists using their socketId
  const existingUser = users.find((user) => user.socketId === socketId);

  if (!existingUser) {
    users.push({ userId, socketId });
  } else {
    existingUser.userId = userId; // Update userId if user already exists
  }
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (receiverId) => {
  return users.find((user) => user.userId === receiverId);
};

io.on("connection", (socket) => {
  console.log(`a user is connected`);

  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  socket.on("sendMessage", ({ senderId, receiverId, text, images }) => {
    // Your createMessage function logic here
    const message = {
      senderId,
      receiverId,
      text,
      images,
      // Additional properties as needed
    };

    const user = getUser(receiverId);

    if (user) {
      io.to(user.socketId).emit("getMessage", message);
    } else {
      // Handle user not found
      console.log(`User with ID ${receiverId} not found`);
    }
  });

  socket.on("messageSeen", ({ senderId, receiverId, messageId }) => {
    const user = getUser(senderId);

    if (user) {
      // Your message seen logic here
      console.log("Message seen logic");
      io.to(user.socketId).emit("messageSeen", {
        senderId,
        receiverId,
        messageId,
      });
    } else {
      // Handle user not found
      console.log(`User with ID ${senderId} not found`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`a user disconnected!`);
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
