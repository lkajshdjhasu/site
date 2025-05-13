import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

export async function GET(request: Request) {
  const responseBody: ActionGetResponse = {
    icon: "https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/starter/react-ui-starter/public/solana.svg",
    title: "DO BLINK!",
    label: "Click me!",
    description: "This is a test description",
    links: {
      actions: [
        {
          href: request.url,
          label: "action",
          type: "transaction",
        },
        {
          href: `${request.url}?action=another`,
          label: "another action",
          type: "transaction",
        },
        {
          href: `${request.url}?action=nickname&param={nameParam}`,
          label: "with param",
          type: "transaction",
          parameters: [
            {
              name: "nameParam",
              label: "Nickname",
              required: true,
            },
          ],
        },
      ],
    },
    error: {
      message: "This is a test error message",
    },
  };
  return Response.json(responseBody, { headers: ACTIONS_CORS_HEADERS });
}

export async function POST(request: Request) {
  const requestBody: ActionPostRequest = await request.json();
  const userPubKey = requestBody.account;

  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const param = url.searchParams.get("param");

  let name = "";

  const user = new PublicKey(userPubKey);

  const ix = SystemProgram.transfer({
    fromPubkey: user,
    toPubkey: user,
    lamports: 1,
  });
  const connection = new Connection(clusterApiUrl("mainnet-beta"));
  const tx = new Transaction();
  if (action === "another") {
    tx.add(ix);
  } else if (action === "nickname") {
    name = param!;
  }
  tx.feePayer = user;
  tx.recentBlockhash = (
    await connection.getLatestBlockhash({
      commitment: "finalized",
    })
  ).blockhash;

  const serializedTx = tx
    .serialize({ requireAllSignatures: false, verifySignatures: false })
    .toString("base64");

  const response: ActionPostResponse = {
    transaction: serializedTx,
    message: `Hello ${name}`,
    type: "transaction",
  };

  return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
}

export async function OPTIONS(request: Request) {
  return Response.json(null, { headers: ACTIONS_CORS_HEADERS });
}
