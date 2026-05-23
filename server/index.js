const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static('public'));
const rooms = {};
io.on('connection', (socket) => {
    socket.on('phone-join', (passcode) => {
        rooms[passcode] = { phone: socket.id };
        socket.join(passcode);
        console.log(`? Phone joined room: ${passcode}`);
    });
    socket.on('laptop-join', (passcode) => {
        if (rooms[passcode]) {
            rooms[passcode].laptop = socket.id;
            socket.join(passcode);
            io.to(rooms[passcode].phone).emit('start-connection');
            setTimeout(() => { socket.emit('start-connection'); }, 500);
            console.log(`? Laptop joined room: ${passcode}`);
        } else {
            socket.emit('error', 'Invalid passcode! Make sure phone is connected first.');
        }
    });
    socket.on('signal', ({ passcode, data }) => {
        socket.to(passcode).emit('signal', data);
    });
    socket.on('disconnect', () => {
        for (let code in rooms) {
            if (rooms[code].phone === socket.id || rooms[code].laptop === socket.id) {
                io.to(code).emit('peer-disconnected');
                delete rooms[code];
                console.log(`? Room ${code} closed`);
            }
        }
    });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => { console.log(`?? Server running on port ${PORT}`); });
