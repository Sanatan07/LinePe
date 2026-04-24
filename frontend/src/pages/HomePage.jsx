import { useEffect } from "react";

import { SOCKET_EVENTS } from "../constants/socket.events";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { authUser, socket } = useAuthStore();
  const { selectedConversation, subscribeToMessages, unsubscribeFromMessages } = useChatStore();

  useEffect(() => {
    if (!authUser || !socket) return;

    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [authUser, socket, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (!socket?.connected) return undefined;

    const conversationId = String(selectedConversation?._id || "");
    if (!conversationId) return undefined;

    socket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, conversationId);

    return () => {
      socket.emit(SOCKET_EVENTS.CONVERSATION_LEAVE, conversationId);
    };
  }, [socket, socket?.connected, selectedConversation?._id]);

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />

            {!selectedConversation ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
