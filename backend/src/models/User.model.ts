import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export interface IUser extends MongooseDocument {
  email: string;
  passwordHash: string;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", userSchema);
