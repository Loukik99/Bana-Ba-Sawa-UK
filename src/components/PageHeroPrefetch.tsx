import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { PAGE_HEROES, prefetchHeroForPath } from "../lib/page-heroes";

export default function PageHeroPrefetch() {
  const { pathname } = useLocation();

  useEffect(() => {
    const paths = Object.keys(PAGE_HEROES).filter((path) => path !== pathname);
    const timeoutId = window.setTimeout(() => {
      paths.forEach(prefetchHeroForPath);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  return null;
}
