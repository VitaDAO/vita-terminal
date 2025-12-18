"use client";

import { motion } from "framer-motion";
import { useIframeData } from "@/contexts/IframeDataContext";

export const Greeting = () => {
  const { privyAuth, isAuthenticated } = useIframeData();

  const getUserGreeting = () => {
    // ONLY show personalized greeting when wallet address is available
    if (isAuthenticated && privyAuth?.user?.wallet?.address) {
      const address = privyAuth.user.wallet.address;
      return `Welcome to the VitaDAO Knowledge Assistant, ${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    // Default greeting - no email, no guest, nothing else
    return "Welcome to the VitaDAO Knowledge Assistant";
  };

  return (
    <div
      className="mx-auto mt-4 flex size-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="font-semibold text-xl md:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        Vita Terminal
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-xl text-zinc-500 md:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        {getUserGreeting()}
      </motion.div>
    </div>
  );
};
