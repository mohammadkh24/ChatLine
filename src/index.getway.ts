import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket  , Server} from 'socket.io';

interface User {
  id: number;
  username: string;
  socketId: string;
}

interface joinPayload {
  roomName: string;
  user: User;
}

interface Message {
  message: string;
  user: User;
  time: string;
  roomName: string;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class indexGetway {
  @WebSocketServer() server: Server;

  @SubscribeMessage('join_room')
  async joinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: joinPayload) {
    if (client.id && data?.roomName) {
      if (client.rooms.has(data.roomName)) {
        console.log('Already joined in roomName : ' + data.roomName);
      } else {
        client.join(data.roomName);
      }
    } else {
      client.emit('exception', 'You are disconnected');
    }
  }

  @SubscribeMessage('server_chat')
  async serverChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: Message,
  ) {
    if (data.roomName) {
        return this.server.to(data.roomName).emit("client-chat" , data)
    }
    return client.emit("exception" , "room not found")
  }

}
