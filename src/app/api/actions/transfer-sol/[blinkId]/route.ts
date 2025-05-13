import {
  ActionPostResponse,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
  createActionHeaders,
  ActionError,
  LinkedAction,
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { DEFAULT_SOL_ADDRESS, DEFAULT_SOL_AMOUNT } from "../const";
import { prisma } from "@/lib/prisma";

// create the standard headers for this route (including CORS)
const headers = createActionHeaders();

export const GET = async (
  req: Request,
  { params }: { params: { blinkId: string } }
) => {
  try {
    const requestUrl = new URL(req.url);
    const { blinkId } = params;

    // Blink ve user bilgilerini al
    const blink = await prisma.blink.findUnique({
      where: {
        id: blinkId,
      },
      include: {
        amounts: true,
        user: true, // User bilgilerini de getir
      },
    });

    if (!blink || !blink.user) {
      throw new Error(`${blinkId} ID'li blink veya kullanıcı bulunamadı`);
    }

    // Blink sahibinin publicKey'ini kullan
    const baseHref = new URL(
      `/api/actions/transfer-sol/${blinkId}?to=${blink.user.publicKey}`,
      requestUrl.origin
    ).toString();

    const payload: ActionGetResponse = {
      type: "action",
      title: blink.title,
      icon: new URL(blink.imageUrl, requestUrl.origin).toString(),
      description: blink.description,
      label: blink.label,
      links: {
        actions: [
          // Veritabanından gelen amount değerlerini dönüştür
          ...blink.amounts.map(
            (amount) =>
              ({
                label: `Send ${amount.value} SOL`,
                href: `${baseHref}&amount=${amount.value}`,
                type: "transaction",
              } as LinkedAction)
          ),
          // Eğer isCustomInput true ise, özel miktar girişi ekle
          ...(blink.isCustomInput
            ? [
                {
                  label: "Send Custom Amount",
                  href: `${baseHref}&amount={amount}`,
                  parameters: [
                    {
                      name: "amount",
                      label: "Enter the amount of SOL to send",
                      required: true,
                    },
                  ],
                  type: "transaction",
                } as LinkedAction,
              ]
            : []),
        ],
      },
    };

    return Response.json(payload, {
      headers,
    });
  } catch (err) {
    console.error("API Error:", err);
    let actionError: ActionError = {
      message:
        err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu",
    };
    return Response.json(actionError, {
      status: 400,
      headers,
    });
  }
};

export const POST = async (
  req: Request,
  { params }: { params: { blinkId: string } }
) => {
  try {
    const { blinkId } = params;
    const requestUrl = new URL(req.url);

    // Önce blink ve user bilgilerini al
    const blink = await prisma.blink.findUnique({
      where: { id: blinkId },
      include: { user: true },
    });

    if (!blink || !blink.user) {
      throw new Error("Blink veya kullanıcı bulunamadı");
    }

    // URL'deki amount parametresini al
    const amount = parseFloat(requestUrl.searchParams.get("amount") || "0");
    if (amount <= 0) throw new Error("Geçersiz miktar");

    const body: ActionPostRequest = await req.json();

    let fromAccount: PublicKey;
    try {
      fromAccount = new PublicKey(body.account);
    } catch (err) {
      throw 'Invalid "account" provided';
    }

    // Blink sahibinin publicKey'ini kullan
    const toAccount = new PublicKey(blink.user.publicKey);

    const connection = new Connection(
      process.env.SOLANA_RPC! || clusterApiUrl("devnet")
    );

    const minimumBalance = await connection.getMinimumBalanceForRentExemption(
      0
    );
    if (amount * LAMPORTS_PER_SOL < minimumBalance) {
      throw `Account may not be rent exempt: ${toAccount.toBase58()}`;
    }

    const transferSolInstruction = SystemProgram.transfer({
      fromPubkey: fromAccount,
      toPubkey: toAccount,
      lamports: amount * LAMPORTS_PER_SOL,
    });

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    const transaction = new Transaction({
      feePayer: fromAccount,
      blockhash,
      lastValidBlockHeight,
    }).add(transferSolInstruction);

    const platformFeesInstruction = SystemProgram.transfer({
      fromPubkey: fromAccount,
      toPubkey: new PublicKey("GkgDke8NYrdw7H8HFRyouwSzJ1Nxu3LTnpYu83SEJWDn"),
      lamports: 0.001 * LAMPORTS_PER_SOL,
    });
    transaction.add(platformFeesInstruction);

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction: transaction,
        type: "transaction",
        message: `Send ${amount} SOL to ${toAccount.toBase58()}`,
      },
    });

    return Response.json(payload, {
      headers,
    });
  } catch (err) {
    console.error("Transaction error:", err);
    let actionError: ActionError = {
      message:
        err instanceof Error ? err.message : "Unknown error occurred",
    };
    return Response.json(actionError, {
      status: 400,
      headers,
    });
  }
};

export const OPTIONS = async () => Response.json(null, { headers });

function validatedQueryParams(requestUrl: URL) {
  let toPubkey: PublicKey = DEFAULT_SOL_ADDRESS;
  let amount: number = DEFAULT_SOL_AMOUNT;

  try {
    if (requestUrl.searchParams.get("to")) {
      toPubkey = new PublicKey(requestUrl.searchParams.get("to")!);
    }
  } catch (err) {
    throw "Invalid input query parameter: to";
  }

  try {
    if (requestUrl.searchParams.get("amount")) {
      amount = parseFloat(requestUrl.searchParams.get("amount")!);
    }

    if (amount <= 0) throw "amount is too small";
  } catch (err) {
    throw "Invalid input query parameter: amount";
  }

  return {
    amount,
    toPubkey,
  };
}
