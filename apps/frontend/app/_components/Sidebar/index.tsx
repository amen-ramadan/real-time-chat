"use client";

import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { IoFilter } from "react-icons/io5";
import MessageItem from "./MessageItem";
import Profile from "../Profile";
import Loading from "../Loading";
import { getReceiverMessages } from "../../libs/filterMessages";
import classNames from "classnames";
import { Store } from "../../libs/globalState";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function Sidebar() {
  const { user, setCurrentReceiver, friends, messages } = Store();

  const pathname = usePathname();
  const receiverId = pathname.slice(1);

  const [actifMessage, setActifMessage] = useState(receiverId);
  const [showProfile, setShowProfile] = useState(false);
  const [showUnSeenMessages, setShowUnSeenMessages] = useState(false);
  const [query, setQuery] = useState("");

  // وظيفة لتصفية جهات الاتصال بناءً على البحث
  const handleSearch = (friend: any) => {
    const fullName = `${friend.firstName} ${friend.lastName}`; // إنشاء الاسم الكامل من الاسم الأول واسم العائلة
    // التحقق مما إذا كان الاسم الكامل يحتوي على النص المدخل في البحث
    return fullName.toLowerCase().includes(query.toLowerCase().trim());
  };

  // وظيفة لتصفية جهات الاتصال بناءً على الرسائل غير المقروءة
  const unseenMessagesContacts = (contact: any) => {
    if (!showUnSeenMessages) return true; // إذا لم يتم تفعيل خيار عرض الرسائل غير المقروءة، إرجاع جميع جهات الاتصال
    const contactMessages = getReceiverMessages(messages, contact._id); // الحصول على رسائل جهة الاتصال المحددة
    // التحقق مما إذا كانت جهة الاتصال تحتوي على رسائل غير مقروءة
    const containUnseenMessages = contactMessages.some(
      (message: any) => !message.seen
    );
    return containUnseenMessages;
  };

  if (showProfile) {
    return <Profile onClose={() => setShowProfile(false)} />;
  }

  console.log("user from sidebar", user);

  return (
    <div className="flex-[1] bg-[#131B20] border-r border-[#a7a8a82f] h-full overflow-y-scroll">
      <div className="flex items-center justify-between bg-[#222C32] p-3 h-16">
        <div className="flex items-center justify-center">
          {user?.profilePicture ? (
            <Image
              className="w-10 h-10 rounded-full cursor-pointer"
              src={user.profilePicture}
              alt="Avatar"
              width={40}
              height={40}
              onClick={() => setShowProfile(true)}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-500 cursor-pointer" onClick={() => setShowProfile(true)} /> // Placeholder
          )}
          <div className="ml-4">
            <p className="text-white text-md">{`${user?.firstName || ''} ${user?.lastName || ''}`}</p>
          </div>
        </div>
      </div>
      <div className="p-3 flex justify-between items-center space-x-3">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search your contacts..."
            className="w-full py-2 pl-10 pr-4 text-white bg-[#222C32] rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
          />
          <FaSearch className="absolute top-0 left-0 mt-3 ml-3 text-gray-400" />
        </div>
        <button
          onClick={() =>
            setShowUnSeenMessages((showUnSeenMessages) => !showUnSeenMessages)
          }
          className={classNames(
            "justify-center rounded-full p-1 cursor-pointer active:bg-[#005C4B] transition-all",
            {
              "bg-[#005C4B]": showUnSeenMessages,
            }
          )}
        >
          <IoFilter size={16} color="#B0BAC0" />
        </button>
      </div>
      <div>
        {friends ? (
          friends.length > 0 ? (
            friends
              .filter(unseenMessagesContacts)
              .filter(handleSearch)
              .map((friend) => (
                <MessageItem
                  key={friend._id}
                  id={friend._id}
                  sender={`${friend.firstName} ${friend.lastName}`}
                  selected={friend._id === actifMessage}
                  profilePicture={friend.profilePicture}
                  setActifMessage={() => setActifMessage(friend._id)}
                  setCurrentReceiver={() => {
                    setCurrentReceiver(friend);
                  }}
                />
              ))
          ) : (
            <div>
              <p className="text-center text-gray-400">No contacts found</p>
            </div>
          )
        ) : (
          <Loading />
        )}
      </div>
    </div>
  );
}
