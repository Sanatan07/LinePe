import { Suspense } from "react";
import ChatMain from "./ChatMain";

export default function ChatPage() {
  return (
    <Suspense>
      <ChatMain />
    </Suspense>
  );
}
