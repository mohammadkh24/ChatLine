import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface User {
  id: string;
  username: string;
  room: string;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer() server: Server;
  private users: User[] = [];

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    const user = this.users.find(u => u.id === client.id);
    if (user) {
      this.users = this.users.filter(u => u.id !== client.id);
      this.server.to(user.room).emit('updateUsers', this.getUsersInRoom(user.room));
      this.server.to(user.room).emit('receiveMessage', {
        id: 'system',
        message: `${user.username} خارج شد`,
        type: 'system'
      });
    }
    console.log('Client disconnected:', client.id);
  }

  private getUsersInRoom(room: string) {
    return this.users.filter(u => u.room === room).map(u => u.username);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { username: string, room: string }) {
    client.join(data.room);
    if (!this.users.find(u => u.id === client.id)) {
      this.users.push({ id: client.id, username: data.username, room: data.room });
    }
    this.server.to(data.room).emit('updateUsers', this.getUsersInRoom(data.room));
    this.server.to(data.room).emit('receiveMessage', {
      id: 'system',
      message: `${data.username} وارد شد`,
      type: 'system'
    });
  }

  @SubscribeMessage('sendMessage')
  handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { message: string, room: string, toUser?: string }) {
    const user = this.users.find(u => u.id === client.id);
    if (!user) return;

    if (data.toUser) {
      // ارسال پیام خصوصی فقط به گیرنده
      const target = this.users.find(u => u.username === data.toUser && u.room === user.room);
      if (target) {
        this.server.to(target.id).emit('receiveMessage', {
          id: user.username,
          message: data.message,
          type: 'private'
        });
      }
      // پیام فرستنده در فرانت‌اند اضافه می‌شود، نیازی به emit از سرور نیست
    } else {
      // ارسال پیام عمومی
      this.server.to(data.room).emit('receiveMessage', { id: user.username, message: data.message, type: 'chat' });
    }
  }

  @SubscribeMessage('typing')
handleTyping(@MessageBody() data: { room: string, id: string }) {
    this.server.to(data.room).emit('typing', data);
}

@SubscribeMessage('stopTyping')
handleStopTyping(@MessageBody() data: { room: string, id: string }) {
    this.server.to(data.room).emit('stopTyping', data);
}

}