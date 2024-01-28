
import { useEffect } from "react";

const useInsidesideClick = (ref, callback) => {
  const handleClick = e => {
    if (ref.current == e.target ) {
      callback();
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  });
};

export default useInsidesideClick;