import dotenv from "dotenv";
import mongoose from "mongoose";

import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

dotenv.config();

const run = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    throw new Error("Missing MongoDB connection string (set MONGODB_URI or MONGO_URI)");
  }

  await mongoose.connect(uri);

  const groupConversations = await Conversation.collection
    .find({ kind: "group" }, { projection: { _id: 1 } })
    .toArray();
  const groupConversationIds = groupConversations.map((conversation) => conversation._id);

  const messageResult =
    groupConversationIds.length > 0
      ? await Message.collection.deleteMany({ conversationId: { $in: groupConversationIds } })
      : { deletedCount: 0 };

  const conversationResult = await Conversation.collection.deleteMany({ kind: "group" });
  const cleanupResult = await Conversation.collection.updateMany(
    {},
    {
      $unset: {
        admins: "",
        createdBy: "",
        groupAvatar: "",
        groupName: "",
      },
    }
  );

  console.log(
    JSON.stringify(
      {
        deletedGroupConversations: conversationResult.deletedCount || 0,
        deletedGroupMessages: messageResult.deletedCount || 0,
        cleanedConversationDocuments: cleanupResult.modifiedCount || 0,
      },
      null,
      2
    )
  );
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
