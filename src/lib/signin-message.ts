import { PublicKey } from "@solana/web3.js";

export class SigninMessage {
  publicKey: PublicKey;
  nonce: string;

  constructor(message: { publicKey: string; nonce: string }) {
    this.publicKey = new PublicKey(message.publicKey);
    this.nonce = message.nonce;
  }

  get message() {
    return `Welcome to Blinks!\n\nPlease sign this message to login.\n\nNonce: ${this.nonce}`;
  }

  static decode(message: string) {
    const lines = message.split("\n");
    const nonce = lines[lines.length - 1].replace("Nonce: ", "");
    return new SigninMessage({ publicKey: "", nonce });
  }
} 