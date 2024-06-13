const http = require('http');
const express = require('express');
const path = require('path');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.resolve("./public")));

app.get('/', (req, res) => {
    return res.sendFile("/public/index.html");
});

server.listen(3000, () => console.log('Server Listening'));

const rooms = {};

io.on('connection', (socket) => {
    socket.on('join-room', ({ roomId, name }) => {
        socket.join(roomId);
        if (!rooms[roomId]) {
            rooms[roomId] = {};
        }
        rooms[roomId][socket.id] = name;
        io.to(roomId).emit('update-users', Object.values(rooms[roomId]));
    });

    socket.on('user-message', (data) => {
        const { roomId, name, message, time } = data;
        io.to(roomId).emit('message', { name, message, time });
    });

    socket.on('typing', (data) => {
        const { roomId, name } = data;
        socket.to(roomId).emit('typing', { name });
    });

    socket.on('stop-typing', (data) => {
        const { roomId, name } = data;
        socket.to(roomId).emit('stop-typing', { name });
    });

    socket.on('disconnect', () => {
        for (let roomId in rooms) {
            if (rooms[roomId][socket.id]) {
                delete rooms[roomId][socket.id];
                io.to(roomId).emit('update-users', Object.values(rooms[roomId]));
            }
        }
    });
});
