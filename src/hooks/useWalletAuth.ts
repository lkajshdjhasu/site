import { useWallet } from "@solana/wallet-adapter-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useCallback, useEffect } from "react";
import bs58 from "bs58";
import { SigninMessage } from "@/lib/signin-message";
import toast from "react-hot-toast";

const LAST_SIGNIN_KEY = "lastSignInTime";
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WALLET_SIGNED_KEY = "walletSigned";

export const useWalletAuth = () => {
  const { signMessage, publicKey, disconnect, connected } = useWallet();
  const { data: session, status } = useSession();

  const shouldRequestSignature = useCallback(() => {
    if (typeof window === "undefined") return false;
    if (status === "loading") return false;

    const lastSignIn = localStorage.getItem(LAST_SIGNIN_KEY);
    const walletSigned = localStorage.getItem(WALLET_SIGNED_KEY);

    // Always require signature if wallet hasn't signed before
    if (!walletSigned) return true;

    if (!lastSignIn) return true;

    const lastSignInTime = parseInt(lastSignIn, 10);
    const now = Date.now();
    return now - lastSignInTime > IDLE_TIMEOUT;
  }, [status]);

  const handleSignIn = useCallback(async () => {
    try {
      if (!publicKey || !signMessage) {
        console.error("Wallet not connected or sign message function missing");
        toast.error("Wallet not connected or sign message function missing");
        return;
      }

      // Always require initial signature
      const walletSigned = localStorage.getItem(WALLET_SIGNED_KEY);
      if (!walletSigned || shouldRequestSignature()) {
        const nonce = Math.random().toString(36).substring(2, 10);
        const message = new SigninMessage({
          publicKey: publicKey.toBase58(),
          nonce,
        });

        console.log("Message created for signing:", message.message);

        try {
          const signature = await signMessage(
            new TextEncoder().encode(message.message)
          );

          console.log("Signature received:", bs58.encode(signature));

          const result = await signIn("credentials", {
            message: JSON.stringify(message),
            signature: bs58.encode(signature),
            redirect: false,
          });

          console.log("Sign in result:", result);

          if (result?.error) {
            console.error("Sign in error:", result.error);
            toast.error(`Sign in error: ${result.error}`);
            throw new Error(result.error);
          }

          // Mark wallet as signed and update last sign-in time
          localStorage.setItem(WALLET_SIGNED_KEY, "true");
          localStorage.setItem(LAST_SIGNIN_KEY, Date.now().toString());
          toast.success("Successfully signed in!");
        } catch (signError) {
          console.error("Signing error:", signError);
          toast.error("Signing process failed");
          return;
        }
      } else if (status === "authenticated") {
        console.log("Using existing session");
        return;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Login failed");
    }
  }, [publicKey, signMessage, status, shouldRequestSignature]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut({ redirect: false });
      await disconnect();
      localStorage.removeItem(LAST_SIGNIN_KEY);
      localStorage.removeItem(WALLET_SIGNED_KEY);
      toast.success("Successfully signed out!");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Sign out failed");
    }
  }, [disconnect]);

  useEffect(() => {
    if (connected && status === "unauthenticated" && publicKey) {
      console.log("Session status:", status);
      handleSignIn();
    }
  }, [connected, status, publicKey, handleSignIn]);

  return {
    handleSignIn,
    handleSignOut,
    session,
  };
};
