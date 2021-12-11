import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useMeQuery } from "../src/generated/graphql";

const useIsAuth = () => {
  const [{data, fetching}] = useMeQuery();
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const router = useRouter();
  useEffect(() => {
    if(data?.me) {
      console.log("You are not logged In");
      setUserLoggedIn(true);
      // router.replace("/login");
    }
  }, [fetching, data, router])
  return userLoggedIn;
}

export default useIsAuth;

// Video: 6:22:00

