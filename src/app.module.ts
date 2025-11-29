import { Module } from '@nestjs/common';
import { ChatGateway } from './chat/chat.getway';



@Module({
  imports: [],
  providers : [ChatGateway]
})
export class AppModule {}
