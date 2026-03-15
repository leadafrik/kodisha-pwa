import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const WELCOME_KEY = "agrisoko_welcomed_v1";
const NEW_USER_HOURS = 48;

export const useFirstVisit = (): { shouldShow: boolean; dismiss: () => void } => {
  const { user } = useAuth();
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (!user) return;

    try {
      if (localStorage.getItem(WELCOME_KEY)) return;

      const createdAt = user.createdAt ? new Date(user.createdAt) : null;
      if (createdAt) {
        const hoursSinceSignup =
          (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceSignup > NEW_USER_HOURS) return;
      }

      setShouldShow(true);
    } catch {
      // localStorage unavailable — skip silently
    }
  }, [user]);

  const dismiss = () => {
    try {
      localStorage.setItem(WELCOME_KEY, "1");
    } catch {
      // ignored
    }
    setShouldShow(false);
  };

  return { shouldShow, dismiss };
};
