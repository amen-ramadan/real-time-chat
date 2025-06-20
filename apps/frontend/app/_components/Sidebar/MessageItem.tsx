import { getReceiverMessages } from "../../libs/filterMessages";
import moment from "moment";
import { Store } from "../../libs/globalState";
import { redirect } from "next/navigation";
import Image from "next/image";

const MessageItem = ({
  sender,
  selected,
  profilePicture,
  setActifMessage,
  setCurrentReceiver,
  id,
}) => {
  const { socket, messages, setMessages } = Store();
  const contactMessages = getReceiverMessages(messages, id);
  const lastMessage = contactMessages[contactMessages.length - 1];

  const unreadMessages = contactMessages.filter(
    (message: { seen: any; receiverId: any }) =>
      !message.seen && message.receiverId !== id
  ).length;

  const onClick = () => {
    // تعيين الرسالة النشطة
    setActifMessage();
    // تعيين المستلم الحالي
    setCurrentReceiver();
    // إرسال حدث "seen" إلى الخادم
    socket?.emit("seen", id);
    // تحديث حالة الرسائل محلياً لتعريفها بأنها "مرئية"
    setMessages(messages.map((message) => ({ ...message, seen: true })));
    // التنقل إلى صفحة المحادثة الجديدة
    redirect(`/${id}`);
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center p-4 cursor-pointer ${
        selected ? "bg-[#2A3942]" : "hover:bg-[#202C33]"
      }`}
    >
      <Image
        src={profilePicture}
        alt="profilePicture"
        className="w-10 h-10 rounded-full mr-4"
      />
      <div>
        <p className="text-white font-semibold">{sender}</p>
        <p className="text-white text-sm">
          {sender._id === id ? "You: " : ""}{" "}
          {lastMessage?.content || "Start conversation here..."}
        </p>
      </div>
      <div className="ml-auto text-gray-400 flex justify-center items-center space-x-4">
        {unreadMessages > 0 && (
          <div className="bg-[#3B82F6] text-white rounded-full w-5 h-5 flex items-center justify-center">
            {unreadMessages}
          </div>
        )}
        <p>{moment(lastMessage?.createdAt).format("hh:mm A")}</p>
      </div>
    </div>
  );
};

export default MessageItem;
