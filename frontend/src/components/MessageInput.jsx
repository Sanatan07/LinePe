import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, RefreshCw, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { SOCKET_EVENTS } from "../constants/socket.events";
import { axiosInstance } from "../lib/axios";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF]/g;

const stripControlChars = (value) =>
  Array.from(value)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join("");

const sanitizePlainText = (value) =>
  typeof value === "string"
    ? stripControlChars(value).replace(ZERO_WIDTH_REGEX, "")
    : "";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [uploadedAttachment, setUploadedAttachment] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [uploadAttempt, setUploadAttempt] = useState(0);
  const fileInputRef = useRef(null);
  const { sendMessage, selectedConversation } = useChatStore();
  const { socket } = useAuthStore();
  const typingStartTimeoutRef = useRef(null);
  const typingStopTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const emitTypingStop = () => {
    if (!socket?.connected || selectedConversation?.kind === "group") return;
    const toUserId = selectedConversation?.participant?._id;
    if (!toUserId) return;
    socket.emit(SOCKET_EVENTS.TYPING_STOP, { toUserId });
    isTypingRef.current = false;
  };

  const scheduleTypingStop = () => {
    if (typingStopTimeoutRef.current) clearTimeout(typingStopTimeoutRef.current);
    typingStopTimeoutRef.current = setTimeout(() => {
      emitTypingStop();
    }, 1200);
  };

  const scheduleTypingStart = () => {
    if (!socket?.connected || selectedConversation?.kind === "group") return;
    const toUserId = selectedConversation?.participant?._id;
    if (!toUserId) return;

    if (typingStartTimeoutRef.current) clearTimeout(typingStartTimeoutRef.current);
    typingStartTimeoutRef.current = setTimeout(() => {
      if (!isTypingRef.current) {
        socket.emit(SOCKET_EVENTS.TYPING_START, { toUserId });
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
  }, [selectedConversation?._id, socket?.id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be 5MB or less");
      return;
    }

    setUploadError("");
    setUploadProgress(0);
    setUploadingFile(file);
    setUploadedAttachment(null);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setUploadProgress(0);
    setUploadError("");
    setUploadedAttachment(null);
    setUploadingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadSelectedImage = async (file) => {
    const form = new FormData();
    form.append("file", file);

    const res = await axiosInstance.post("/messages/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        const total = event.total || file.size || 0;
        if (!total) return;
        const percent = Math.round((event.loaded / total) * 100);
        setUploadProgress(percent);
      },
    });

    return res.data?.attachment;
  };

  useEffect(() => {
    if (!uploadingFile) return;

    let cancelled = false;

    (async () => {
      try {
        const attachment = await uploadSelectedImage(uploadingFile);
        if (cancelled) return;

        if (!attachment?.url) {
          setUploadError("Upload failed");
          return;
        }

        setUploadedAttachment(attachment);
        setUploadProgress(100);
      } catch (error) {
        if (cancelled) return;
        setUploadError(error?.response?.data?.message || "Upload failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uploadingFile, uploadAttempt]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmedText = text.trim();

    if (!trimmedText && !uploadedAttachment) return;

    if (trimmedText.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Message must be ${MAX_MESSAGE_LENGTH} characters or less`);
      return;
    }

    if (uploadingFile && !uploadedAttachment) {
      toast.error("Please wait for the upload to finish");
      return;
    }

    try {
      emitTypingStop();
      await sendMessage({
        text: trimmedText,
        attachments: uploadedAttachment ? [uploadedAttachment] : [],
      });

      // Clear form
      setText("");
      removeImage();
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
          <div className="flex-1">
            {uploadError ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-error">{uploadError}</span>
                <button
                  type="button"
                  className="btn btn-xs btn-ghost"
                  onClick={() => {
                    if (!uploadingFile) return;
                    setUploadError("");
                    setUploadProgress(0);
                    setUploadAttempt((value) => value + 1);
                  }}
                >
                  <RefreshCw className="size-4" />
                  Retry
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <progress
                  className="progress progress-primary w-40"
                  value={uploadProgress}
                  max="100"
                />
                <span className="text-xs text-base-content/60">
                  {uploadedAttachment ? "Uploaded" : `Uploading ${uploadProgress}%`}
                </span>
              </div>
            )}
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
            maxLength={MAX_MESSAGE_LENGTH}
            onChange={(e) => {
              const next = sanitizePlainText(e.target.value).slice(0, MAX_MESSAGE_LENGTH);
              setText(next);
              if (next.trim().length > 0) {
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
          disabled={(!text.trim() && !uploadedAttachment) || Boolean(uploadError) || (uploadingFile && !uploadedAttachment)}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};
export default MessageInput;
