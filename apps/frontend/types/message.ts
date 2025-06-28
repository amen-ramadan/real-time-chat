export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string; // ISO date string or Date object
  seen?: boolean;
  // Potentially other fields like 'type' (text, image, etc.)
}
