import Pusher from "pusher";

// Ignora o erro no build se as chaves não estiverem lá ainda
export const serverPusher = new Pusher({
	appId: process.env.PUSHER_APP_ID || "2185682",
	key: process.env.NEXT_PUBLIC_PUSHER_KEY || "b4c167b75eb392ad4548",
	secret: process.env.PUSHER_SECRET || "8c04c64025ef837d040c",
	cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "sa1",
	useTLS: true,
});
