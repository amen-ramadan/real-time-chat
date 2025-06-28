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

  async getMessages(userId: string, partnerId: string) {
    // Find messages exchanged between the authenticated user (userId) and the partner (partnerId)
    return this.messageModel
      .find({
        $or: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      })
      .sort({ createdAt: 1 }) // Sort by creation time
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

  async markMessagesAsSeen(
    senderId: string,
    receiverId: string,
  ): Promise<void> {
    await this.messageModel
      .updateMany(
        { senderId, receiverId, seen: false },
        { seen: true },
        { multi: true },
      )
      .exec();
  }
}
