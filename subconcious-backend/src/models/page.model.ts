import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITag {
  name: string;
  status: "accepted" | "suggested";
}

export interface IPage extends Document {
  title: string;
  content: any; // Raw Tiptap JSON, stored as-is
  parentId: Types.ObjectId | null;
  userId: Types.ObjectId;
  tags: ITag[];
  isPublic: boolean;
  includeSubpagesInShare: boolean;
  shareSlug: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const tagSchema = new Schema<ITag>(
  {
    name: { type: String, required: true },
    status: { type: String, enum: ["accepted", "suggested"], required: true },
  },
  { _id: false }
);

const pageSchema = new Schema<IPage>(
  {
    title: { type: String, default: "Untitled" },
    content: { type: Schema.Types.Mixed, default: null },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Page",
      default: null,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tags: { type: [tagSchema], default: [] },
    isPublic: { type: Boolean, default: false },
    includeSubpagesInShare: { type: Boolean, default: false },
    shareSlug: {
      type: String,
      unique: true,
      sparse: true,
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index for fetching all pages of a user efficiently
pageSchema.index({ userId: 1, parentId: 1, order: 1 });

export const Page = mongoose.model<IPage>("Page", pageSchema);
