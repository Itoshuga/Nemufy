"use client";

import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadMetadata,
} from "firebase/storage";
import { getFirebaseClientStorage } from "@/lib/firebase/storage/client";

const imageMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const audioMimeTypes = [
  "audio/mpeg",
  "audio/wav",
  "audio/flac",
  "audio/mp4",
  "audio/x-m4a",
] as const;

export type UploadProgress = {
  transferred: number;
  total: number;
  percent: number;
};

export type UploadResult = {
  storagePath: string;
  downloadUrl: string;
  contentType: string;
  size: number;
};

export type UploadController = {
  promise: Promise<UploadResult>;
  cancel(): boolean;
};

type AuthorizationMetadata = {
  artistId: string;
  labelId?: string;
  releaseId?: string;
};

function safeFileName(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  return `${crypto.randomUUID()}.${extension.replace(/[^a-z0-9]/g, "")}`;
}

function startUpload(
  file: File,
  storagePath: string,
  authorization: AuthorizationMetadata,
  onProgress?: (progress: UploadProgress) => void,
): UploadController {
  const metadata: UploadMetadata = {
    contentType: file.type,
    customMetadata: {
      artistId: authorization.artistId,
      ...(authorization.labelId ? { labelId: authorization.labelId } : {}),
      ...(authorization.releaseId
        ? { releaseId: authorization.releaseId }
        : {}),
    },
  };
  const uploadTask = uploadBytesResumable(
    ref(getFirebaseClientStorage(), storagePath),
    file,
    metadata,
  );
  const promise = new Promise<UploadResult>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        onProgress?.({
          transferred: snapshot.bytesTransferred,
          total: snapshot.totalBytes,
          percent:
            snapshot.totalBytes === 0
              ? 0
              : Math.round(
                  (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
                ),
        });
      },
      reject,
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({
          storagePath: uploadTask.snapshot.ref.fullPath,
          downloadUrl,
          contentType: file.type,
          size: file.size,
        });
      },
    );
  });
  return { promise, cancel: () => uploadTask.cancel() };
}

export async function validateImageFile(
  file: File,
  options: { maxBytes: number; minWidth: number; minHeight: number },
) {
  if (!imageMimeTypes.includes(file.type as (typeof imageMimeTypes)[number])) {
    throw new Error("Choose a JPEG, PNG or WEBP image.");
  }
  if (file.size > options.maxBytes) {
    throw new Error(
      `The image must be smaller than ${Math.round(options.maxBytes / 1024 / 1024)} MB.`,
    );
  }
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width < options.minWidth || bitmap.height < options.minHeight) {
      throw new Error(
        `The image must be at least ${options.minWidth} × ${options.minHeight} px.`,
      );
    }
  } finally {
    bitmap.close();
  }
}

export function validateAudioFile(file: File) {
  if (!audioMimeTypes.includes(file.type as (typeof audioMimeTypes)[number])) {
    throw new Error("Choose an MP3, WAV, FLAC, MP4 or M4A audio file.");
  }
  if (file.size > 500 * 1024 * 1024) {
    throw new Error("The audio file must be smaller than 500 MB.");
  }
}

export async function uploadArtistImage(
  kind: "avatar" | "banner",
  artistId: string,
  file: File,
  authorization: AuthorizationMetadata,
  onProgress?: (progress: UploadProgress) => void,
) {
  await validateImageFile(
    file,
    kind === "avatar"
      ? { maxBytes: 8 * 1024 * 1024, minWidth: 512, minHeight: 512 }
      : { maxBytes: 12 * 1024 * 1024, minWidth: 1200, minHeight: 400 },
  );
  return startUpload(
    file,
    `artists/${artistId}/${kind}/${safeFileName(file)}`,
    authorization,
    onProgress,
  );
}

export async function uploadReleaseCover(
  releaseId: string,
  file: File,
  authorization: AuthorizationMetadata,
  onProgress?: (progress: UploadProgress) => void,
) {
  await validateImageFile(file, {
    maxBytes: 12 * 1024 * 1024,
    minWidth: 1000,
    minHeight: 1000,
  });
  return startUpload(
    file,
    `releases/${releaseId}/cover/${safeFileName(file)}`,
    authorization,
    onProgress,
  );
}

export function uploadTrackAudio(
  trackId: string,
  file: File,
  authorization: AuthorizationMetadata,
  onProgress?: (progress: UploadProgress) => void,
) {
  validateAudioFile(file);
  return startUpload(
    file,
    `tracks/${trackId}/audio/${safeFileName(file)}`,
    authorization,
    onProgress,
  );
}

export async function uploadTrackCover(
  trackId: string,
  file: File,
  authorization: AuthorizationMetadata,
  onProgress?: (progress: UploadProgress) => void,
) {
  await validateImageFile(file, {
    maxBytes: 8 * 1024 * 1024,
    minWidth: 512,
    minHeight: 512,
  });
  return startUpload(
    file,
    `tracks/${trackId}/cover/${safeFileName(file)}`,
    authorization,
    onProgress,
  );
}
