"use client";

import { useState } from "react";
import { FaCamera } from "react-icons/fa";
import { IoMdReturnLeft } from "react-icons/io";
import EditableInput from "./EditableInput";
import { updateProfilePicture } from "../../libs/requests";
import Image from "next/image";
import { Store } from "../../libs/globalState";

type ProfileProps = {
  onClose: () => void;
};

export default function Profile({ onClose }: ProfileProps) {
  const { user, accessToken } = Store();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [status, setStatus] = useState(user?.status ?? "");
  const [image, setImage] = useState(user?.profilePicture ?? "");

  const handleProfilePictureChange = async (e: any) => {
    if (e.target.files && e.target.files[0]) {
      setImage(URL.createObjectURL(e.target.files[0])); // عرض معاينة فورية للصورة المختارة

      const formData = new FormData(); // إنشاء كائن FormData لإرسال الملف
      formData.append("profilePicture", e.target.files[0]); // إضافة الملف إلى النموذج

      if (accessToken) {
        await updateProfilePicture(accessToken, formData); // إرسال الطلب إلى الخادم
      }
    }
  };

  return (
    <div className="flex-[1] bg-[#131B20] border-r border-[#a7a8a82f] h-screen">
      <div className="flex space-x-4 items-center bg-[#222C32] p-4 h-16">
        <button
          className="justify-center rounded-full p-1 cursor-pointer active:bg-[#005C4B] transition-all"
          onClick={onClose}
        >
          <IoMdReturnLeft
            size={24}
            color="#B0BAC0"
            className="cursor-pointer"
          />
        </button>
        <p className="text-white text-lg">Profile</p>
      </div>
      <div className="px-4 space-y-4">
        <div className="">
          <div className="flex items-center justify-center py-7 select-none">
            <div className="relative w-[200px] h-[200px]">
              <Image
                src={image}
                alt="Avatar"
                className="w-full h-full rounded-full transition-opacity duration-300"
              />
              <div className="absolute cursor-pointer inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300">
                <div className="text-white flex flex-col items-center justify-center mx-2">
                  <FaCamera size={24} color="#B0BAC0" />
                  <p className="text-center">Change the profile picture</p>
                </div>
                <input
                  type="file"
                  onChange={handleProfilePictureChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <EditableInput
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            label="Your firstname"
            id="firstName"
          />
          <EditableInput
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            label="Your lastname"
            id="lastName"
          />
          <EditableInput
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            label="Status"
            id="status"
            placeholder="Set a status..."
          />
        </form>
      </div>
    </div>
  );
}
