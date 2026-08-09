import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  console.log("Upload API called");

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const filename = formData.get("filename") as string;

    console.log("File received:", filename, "Size:", file?.size);

    if (!file) {
      console.error("No file in formData");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("Starting upload to Vercel Blob...");

    // Convert File to Buffer

    const blob = await put(filename, file, {
      access: "public",
    });

    console.log("Upload successful:", blob.url);
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
