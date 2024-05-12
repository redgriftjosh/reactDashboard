import { useContext } from "react";
import { Context } from "../../App";

const LoggedIn = () => {
  const userInfo = useContext(Context);
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1>hello, {userInfo?.firstName}</h1>
      </div>
    </div>
  );
};

export default LoggedIn;
