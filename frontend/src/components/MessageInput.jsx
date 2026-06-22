"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import {
  FileText,
  Image as ImageIcon,
  Paperclip,
  RefreshCw,
  Send,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { SOCKET_EVENTS } from "../constants/socket.events";
import { axiosInstance } from "../lib/axios";

const MAX_MESSAGE_LENGTH = 2000;
const ZERO_WIDTH_REGEX = /[​-‍﻿]/g;

const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024,
  video: 50 * 1024 * 1024,
  document: 25 * 1024 * 1024,
};

const FILE_SIZE_LABELS = { image: "5MB", video: "50MB", document: "25MB" };

const ACCEPT_TYPES = [
  "image/*",
  "video/mp4,video/webm,video/ogg,video/quicktime",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
].join(",");

const getFileCategory = (mimeType = "") => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
};

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
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [uploadedAttachment, setUploadedAttachment] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [uploadAttempt, setUploadAttempt] = useState(0);
  const fileInputRef = useRef(null);
  const { sendMessage, selectedConversation } = useChatStore();
  const { socket } = useAuthStore();
  const typingStopTimeoutRef = useRef(null);

  const emitTypingStop = useCallback(() => {
    const conversationId = selectedConversation?._id;
    if (!socket?.connected || !conversationId) return;
    socket.emit(SOCKET_EVENTS.TYPING_STOP, { conversationId });
  }, [selectedConversation?._id, socket]);

  const handleTyping = (e) => {
    const next = sanitizePlainText(e.target.value).slice(0, MAX_MESSAGE_LENGTH);
    setText(next);

    const conversationId = selectedConversation?._id;
    if (!socket?.connected || !conversationId) return;

    socket.emit(SOCKET_EVENTS.TYPING_START, { conversationId });

    if (typingStopTimeoutRef.current)
      clearTimeout(typingStopTimeoutRef.current);

    typingStopTimeoutRef.current = setTimeout(() => {
      socket.emit(SOCKET_EVENTS.TYPING_STOP, { conversationId });
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (typingStopTimeoutRef.current)
        clearTimeout(typingStopTimeoutRef.current);
      emitTypingStop();
    };
  }, [emitTypingStop]);

  const clearFile = () => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFilePreviewUrl(null);
    setUploadProgress(0);
    setUploadError("");
    setUploadedAttachment(null);
    setUploadingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const category = getFileCategory(file.type);
    const limit = FILE_SIZE_LIMITS[category];

    if (file.size > limit) {
      toast.error(
        `${category === "image" ? "Image" : category === "video" ? "Video" : "Document"} must be ${FILE_SIZE_LABELS[category]} or less`,
      );
      return;
    }

    setUploadError("");
    setUploadProgress(0);
    setUploadingFile(file);
    setUploadedAttachment(null);

    if (category === "image" || category === "video") {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(URL.createObjectURL(file));
    } else {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
  };

  const uploadSelectedFile = async (file) => {
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
        const attachment = await uploadSelectedFile(uploadingFile);
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

      setText("");
      clearFile();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const fileCategory = uploadingFile
    ? getFileCategory(uploadingFile.type)
    : null;
  const hasFile = Boolean(uploadingFile);

  return (
    <div className="p-4 w-full">
      {hasFile && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            {fileCategory === "image" && filePreviewUrl && (
              <img
                src={filePreviewUrl}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
              />
            )}
            {fileCategory === "video" && filePreviewUrl && (
              <video
                src={filePreviewUrl}
                className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
              />
            )}
            {fileCategory === "document" && (
              <div className="w-20 h-20 rounded-lg border border-zinc-700 bg-base-200 flex flex-col items-center justify-center gap-1 px-1">
                <FileText className="size-7 text-primary" />
                <span className="text-[9px] text-base-content/60 truncate w-full text-center px-1">
                  {uploadingFile?.name}
                </span>
              </div>
            )}
            <button
              onClick={clearFile}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
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
                    setUploadAttempt((v) => v + 1);
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
                  {uploadedAttachment
                    ? "Uploaded"
                    : `Uploading ${uploadProgress}%`}
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
            onChange={handleTyping}
            onBlur={emitTypingStop}
          />
          <input
            type="file"
            accept={ACCEPT_TYPES}
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle ${hasFile ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
            title="Attach image, video, or document"
          >
            <Paperclip size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={
            (!text.trim() && !uploadedAttachment) ||
            Boolean(uploadError) ||
            (uploadingFile && !uploadedAttachment)
          }
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};
export default MessageInput;
