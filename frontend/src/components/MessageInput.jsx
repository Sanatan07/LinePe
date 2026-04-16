import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { SOCKET_EVENTS } from "../constants/socket.events";

const MAX_MESSAGE_LENGTH = 2000;

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage, selectedUser } = useChatStore();
  const { socket } = useAuthStore();
  const typingStartTimeoutRef = useRef(null);
  const typingStopTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const emitTypingStop = () => {
    if (!socket?.connected || !selectedUser?._id) return;
    socket.emit(SOCKET_EVENTS.TYPING_STOP, { toUserId: selectedUser._id });
    isTypingRef.current = false;
  };

  const scheduleTypingStop = () => {
    if (typingStopTimeoutRef.current) clearTimeout(typingStopTimeoutRef.current);
    typingStopTimeoutRef.current = setTimeout(() => {
      emitTypingStop();
    }, 1200);
  };

  const scheduleTypingStart = () => {
    if (!socket?.connected || !selectedUser?._id) return;

    if (typingStartTimeoutRef.current) clearTimeout(typingStartTimeoutRef.current);
    typingStartTimeoutRef.current = setTimeout(() => {
      if (!isTypingRef.current) {
        socket.emit(SOCKET_EVENTS.TYPING_START, { toUserId: selectedUser._id });
        isTypingRef.current = true;
      }
    }, 250);
  };

  useEffect(() => {
    return () => {
      if (typingStartTimeoutRef.current) clearTimeout(typingStartTimeoutRef.current);
      if (typingStopTimeoutRef.current) clearTimeout(typingStopTimeoutRef.current);
      emitTypingStop();
    };
  }, [selectedUser?._id, socket?.id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmedText = text.trim();

    if (!trimmedText && !imagePreview) return;

    if (trimmedText.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Message must be ${MAX_MESSAGE_LENGTH} characters or less`);
      return;
    }

    try {
      emitTypingStop();
      await sendMessage({
        text: trimmedText,
        image: imagePreview,
      });

      // Clear form
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (e.target.value.trim().length > 0) {
                scheduleTypingStart();
                scheduleTypingStop();
              } else {
                emitTypingStop();
              }
            }}
            onBlur={emitTypingStop}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};
export default MessageInput;
