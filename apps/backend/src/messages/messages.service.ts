import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Message,
  MessageDocument,
} from './schemas/message.schema/message.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async getMessages(userId: string) {
    return this.messageModel
      .find({
        $or: [{ senderId: userId }, { receiverId: userId }],
      })
      .exec();
  }

  async createMessage({
    senderId,
    receiverId,
    content,
  }: {
    senderId: string;
    receiverId: string;
    content: string;
  }) {
    const message = await this.messageModel.create({
      senderId,
      receiverId,
      content,
    });
    return message;
  }
}
