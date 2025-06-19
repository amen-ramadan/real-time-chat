import logoHsoub from "../../assets/hsoub.png";
import { IoLogOutOutline } from "react-icons/io5";
import { Store } from "../../libs/globalState";
import { redirect } from "next/navigation";
import Image from "next/image";

export default function NoUserSelected() {
  const { setAccessToken, setUser } = Store();

  const handleLogout = () => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    redirect("/");
  };

  return (
    <div className="flex flex-col flex-[3]">
      <div className="flex items-center justify-end bg-[#222C32] h-16 p-3">
        <div className="flex space-x-4">
          <button className="justify-center rounded-full p-1 cursor-pointer active:bg-[#005C4B] transition-all">
            <IoLogOutOutline
              onClick={handleLogout}
              size={20}
              color="#B0BAC0"
              className="cursor-pointer"
            />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center items-center space-y-8 bg-[#0B141A]">
        <div>
          <Image src={logoHsoub} alt="logo" className="w-64" />
        </div>
        <div>
          <h1 className="text-white text-3xl">Welcome to Chat App</h1>
        </div>
      </div>
    </div>
  );
}
