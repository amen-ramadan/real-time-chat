"use client";

import { useState } from "react";
import { FaEdit, FaCheck } from "react-icons/fa";
import cn from "classnames";
import { updateUser } from "../../libs/requests";
import { Store } from "../../libs/globalState";

interface EditableInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  id: string;
  placeholder?: string;
}

export default function EditableInput({
  value,
  onChange,
  label,
  id,
  placeholder,
}: EditableInputProps) {
  const { accessToken } = Store();
  const [isEditable, setIsEditable] = useState(false);

  const handleEdit = () => {
    setIsEditable(true);
  };
  const handleNotEdit = async () => {
    setIsEditable(false);

    if (!accessToken) return;
    await updateUser(accessToken, {
      [id]: value,
    });
  };

  return (
    <div>
      <label htmlFor={"fullName"} className="text-[#005C4B]">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn("w-full bg-transparent outline-none text-white py-1", {
            "border-b border-[#B0BAC0]": isEditable,
          })}
          disabled={!isEditable}
        />
        {!isEditable ? (
          <FaEdit
            size={22}
            color="#B0BAC0"
            className="absolute right-0 h-full bottom-0 cursor-pointer"
            onClick={handleEdit}
          />
        ) : (
          <FaCheck
            size={22}
            color="#B0BAC0"
            className="absolute right-0 h-full bottom-0 cursor-pointer"
            onClick={handleNotEdit}
          />
        )}
      </div>
    </div>
  );
}
