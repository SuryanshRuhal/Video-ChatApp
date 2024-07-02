const {Server} = require("socket.io");
const io = new Server(8000, {
    cors: true,
});
const emailToSocketIdMap= new Map();
const socketIdToEmailMap= new Map();
io.on("connection", (socket) => {
   console.log(`Socket is Connected`,socket.id);
   socket.on("room:join",data=>{
    const {contact}=data;
    emailToSocketIdMap.set(contact.email, socket.id);
    socketIdToEmailMap.set(socket.id,contact.email);
    io.to(contact.room).emit("user:joined",{contact,id:socket.id});
    socket.join(contact.room);
    io.to(socket.id).emit("room:join",data);
   });

  socket.on("user:call",({to,offer})=>{
    io.to(to).emit("incoming:call", {from: socket.id, offer});
  })

  socket.on("call:accepted",({to,ans})=>{
    io.to(to).emit("call:accepted", {from: socket.id, ans});
  })

  socket.on("peer:nego:needed",({to,offer})=>{
    io.to(to).emit("peer:nego:needed", {from: socket.id, offer});
  });

  socket.on("peer:nego:done",({to,ans})=>{
    io.to(to).emit("peer:nego:final", {from: socket.id, ans});
  });
});

