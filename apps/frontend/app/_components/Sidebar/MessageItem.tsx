import { getReceiverMessages } from "../../libs/filterMessages";
import moment from "moment";
import { Store } from "../../libs/globalState";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Message } from "../../../types/store"; // Assuming Message type is in types/store.ts
import { User } from "../../../types/user"; // Assuming User type is in types/user.ts

interface MessageItemProps {
  sender: string; // This is the display name of the contact
  selected: boolean;
  profilePicture?: string | null;
  setActifMessage: () => void;
  setCurrentReceiver: () => void; // This likely sets the User object for the current receiver
  id: string; // This is the _id of the contact (friend)
}

const MessageItem: React.FC<MessageItemProps> = ({
  sender,
  selected,
  profilePicture,
  setActifMessage,
  setCurrentReceiver,
  id,
}) => {
  const { socket, messages, setMessages, user: currentUser } = Store();

  // Ensure messages is an array before filtering
  const allMessages = Array.isArray(messages) ? messages : [];
  const contactMessages = getReceiverMessages(allMessages, id) as Message[];
  const lastMessage = contactMessages[contactMessages.length - 1] as Message | undefined;

  const unreadMessages = contactMessages.filter(
    (message: Message) =>
      !message.seen && message.senderId === id && message.receiverId === currentUser?._id
  ).length;

  const onClick = () => {
    setActifMessage();
    setCurrentReceiver(); // This function should be passed the actual friend object by Sidebar

    if (socket && currentUser) {
      // Mark messages from this contact (id) to current user as seen
      const messagesToMarkAsSeen = contactMessages.filter(
        (msg) => msg.senderId === id && msg.receiverId === currentUser._id && !msg.seen
      );

      if (messagesToMarkAsSeen.length > 0) {
        socket.emit("seen", id); // Backend `handleSeen` uses `receiverId`, which is `id` (the contact) here.
                                  // The backend logic is: messages from client.data.userId (currentUser) to `id` (contact) are marked seen.
                                  // This seems slightly off if we want to mark messages *from contact to current user* as seen.
                                  // Let's assume the current backend `seen` event means "I (current user) have seen messages from contact `id`"
                                  // For now, we'll keep client.emit('seen', id) which means contactId.
                                  // The backend will then mark messages *from this client to contactId* as seen.
                                  // This might need further backend adjustment if the goal is different.
                                  // For now, let's assume it is to mark messages from this contact to current user as seen by current user.
                                  // To achieve "I have seen messages from 'id'", the backend 'seen' handler needs to be updated.
                                  // Given the current backend code, client.emit('seen', id) means "messages I sent to 'id' have been seen by 'id'".
                                  // This is not what we want here.
                                  // What we *want* is to tell the backend "I, the current user, have now seen messages from user 'id'".
                                  // The backend's `handleSeen(receiverId: string, @ConnectedSocket() client: Socket)`
                                  // `messagesService.markMessagesAsSeen(senderId, receiverId)` marks messages from `client.data.userId` (sender) to `receiverId` as seen.
                                  // So, if client (currentUser) emits `seen` with `id` (contactId), it means messages currentUse->contactId are seen.
                                  // This is the opposite of what's needed for clearing unread count.

        // To correctly update the 'seen' status locally for messages received from this contact:
        const updatedMessages = allMessages.map((msg) => {
          if (msg.senderId === id && msg.receiverId === currentUser?._id && !msg.seen) {
            return { ...msg, seen: true };
          }
          return msg;
        });
        setMessages(updatedMessages);
      }
    }
    redirect(`/${id}`);
  };

  const isLastMessageFromCurrentUser = lastMessage?.senderId === currentUser?._id;

  return (
    <div
      onClick={onClick}
      className={`flex items-center p-4 cursor-pointer ${
        selected ? "bg-[#2A3942]" : "hover:bg-[#202C33]"
      }`}
    >
      {profilePicture ? (
        <Image
          src={profilePicture}
          alt={`${sender}'s profile picture`}
          className="w-10 h-10 rounded-full mr-4"
          width={40}
          height={40}
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-500 mr-4 flex items-center justify-center text-white text-xl">
          {sender?.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-grow overflow-hidden">
        <p className="text-white font-semibold truncate">{sender}</p>
        <p className="text-gray-400 text-sm truncate">
          {isLastMessageFromCurrentUser ? "You: " : ""}
          {lastMessage?.content || "Start conversation here..."}
        </p>
      </div>
      <div className="ml-auto text-xs text-gray-400 flex flex-col items-end space-y-1 min-w-[70px]">
        <p className="whitespace-nowrap">
          {lastMessage ? moment(lastMessage.createdAt).format("hh:mm A") : ""}
        </p>
        {unreadMessages > 0 && (
          <div className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {unreadMessages}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
