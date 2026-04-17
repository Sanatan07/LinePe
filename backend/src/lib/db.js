import mongoose from "mongoose";

export const  connectDB  = async () => {
    try{
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!uri) {
            throw new Error("Missing MongoDB connection string (set MONGODB_URI or MONGO_URI)");
        }
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }catch(error){
        console.error("MongoDB connection error:", error);
    }
};  
