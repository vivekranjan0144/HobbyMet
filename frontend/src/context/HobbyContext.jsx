import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getCategories } from "../api/hobby.api";

const HobbyContext = createContext(null);
export const useHobbies = () => useContext(HobbyContext);

export function HobbyProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  return (
    <HobbyContext.Provider value={{ categories }}>
      {children}
    </HobbyContext.Provider>
  );
}
