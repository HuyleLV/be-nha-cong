import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*'} })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  emitToRoom(room: string, event: string, payload: any){
    this.server.to(room).emit(event, payload);
  }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { room: string }, @ConnectedSocket() client: Socket){
    if (data?.room) {
      client.join(data.room);
      client.emit('joined', { room: data.room });
    }
  }
}
