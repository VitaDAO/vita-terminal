"use client";

import { motion } from "framer-motion";
import { usePrivyAuth } from "@/contexts/PrivyAuthContext";
import { useSession } from "next-auth/react";

export const Greeting = () => {
  const { user: privyUser } = usePrivyAuth();
  const { data: session } = useSession();

  const getUserGreeting = () => {
    // Try Privy wallet address first
    if (privyUser?.wallet?.address) {
      const address = privyUser.wallet.address;
      return `Welcome to the VitaDAO Knowledge Assistant, ${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    // Try Privy email
    if (privyUser?.email) {
      return `Welcome to the VitaDAO Knowledge Assistant, ${privyUser.email}`;
    }
    
    // Try NextAuth email
    if (session?.user?.email) {
      return `Welcome to the VitaDAO Knowledge Assistant, ${session.user.email}`;
    }
    
    // Fallback
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
