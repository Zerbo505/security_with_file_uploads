import cloudinary from "@/lib/cloudinary.js";
import groupArray from "@/utils/groupArray.js";
import { extractPublicId } from "cloudinary-build-url";
import type { Request, Response } from "express";
import crypto from "node:crypto";

function createSignature(payload: Record<string, any>, apiSecret: string) {
  const sortedParams =
    Object.entries(payload)
      .sort()
      .map(([key, value]) => `${key}=${value}`)
      .join("&") + apiSecret;
  const hash = crypto.createHash("sha1").update(sortedParams).digest("hex");
  return hash;
}

export function signUploadRequest(
  req: Request<any, any, any, { should_secure_asset?: boolean }>,
  res: Response<ApiResponse>
) {
  const validityInMinutes = 30; //in minutes
  const offset = Math.max(60 - validityInMinutes, 3) * 60; // offset in seconds (55 minutes in seconds)
  const timestamp = Math.round(new Date().getTime() / 1000) - offset;
  const shouldSecureAsset = req.query.should_secure_asset == true;
  const payload: Record<string, any> = {
    timestamp,
    folder: "kyc/1",
    use_filename: true,
  };

  if (shouldSecureAsset) payload["type"] = "private";

  const { CLOUDINARY_API_SECRET } = process.env;

  const signature = cloudinary.utils.api_sign_request(
    payload,
    CLOUDINARY_API_SECRET
  );

  const validity = Math.round((3600 - offset) / 60);

  const manualSignature = createSignature(payload, CLOUDINARY_API_SECRET);

  res.status(200).json({
    status: "success",
    data: {
      payload,
      signature,
      manualSignature,
      cloudname: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      expiresIn: `${validity} min${validity == 1 ? "" : "s"}`,
    //   offset
    },
  });
}

export async function deleteFilesFromCloudinary(
  req: Request<any, any, Partial<{ urls: UrlObject[] }>>,
  res: Response<ApiResponse>
) {
  const { urls } = req.body ?? {};
  console.log({ urls });

  if (!urls) {
    return res
      .status(400)
      .json({ status: "failed", message: "Please provide the urls to delete" });
  }

  if (!Array.isArray(urls)) {
    return res.status(400).json({
      status: "failed",
      message: "Please provide the urls as an array of url objects",
    });
  }

  const isValid = !urls.some(
    ({ type, url }) =>
      !type ||
      !url ||
      !["image", "video", "raw"].includes(type) ||
      !`${url}`.startsWith("https://")
  );

  if (!isValid) {
    return res.status(400).json({
      status: "failed",
      message: "Please provide a valid array of url objects",
    });
  }

  //   const deleteResponse = deleteResourcesFromCloudinary(urls, "image");

  const groupedUrlsByType = groupArray(urls, "type");

  const deleteResponse = await Promise.all(
    Object.entries(groupedUrlsByType).map(async ([resource_type, urls]) => ({
      resource_type,
      response: await deleteResourcesFromCloudinary(
        urls as UrlObject[],
        resource_type as CloudinaryResourceType
      ),
    }))
  );

  res.json({
    status: "success",
    data: {
      deleteResponse,
      //   groupedUrlsByType,
      //   entries,
    },
  });

  //   const deleteResults = await Promise.all(
  //     urls.map((url) => cloudinary.uploader.destroy(url))
  //   );
}

async function deleteResourcesFromCloudinary(
  urls: UrlObject[],
  resource_type: CloudinaryResourceType
) {
  const urlPublicIdsToDelete = urls.map(({ url }) => extractPublicId(url));

  const deleteResponse = await cloudinary.api.delete_resources(
    urlPublicIdsToDelete,
    {
      resource_type,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    }
  );

  return deleteResponse;
}

export function generateDownloadUrl(
  req: Request<any, any, any, { public_id?: string; format?: string }>,
  res: Response<ApiResponse>
) {
  const { public_id: publicId, format } = req.query;

  if (!publicId || !format) {
    return res.status(400).json({
      status: "failed",
      message:
        "Please provide both the public id and format of the file you want to download",
    });
  }

  const oneMinuteFromNow = new Date();
  const validityInMinutes = 1;
  oneMinuteFromNow.setMinutes(
    oneMinuteFromNow.getMinutes() + validityInMinutes
  );
  const { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  const downloadUrl = cloudinary.utils.private_download_url(publicId, format, {
    expires_at: Math.round(oneMinuteFromNow.getTime() / 1000),
    // api_key: CLOUDINARY_API_KEY,
    // api_secret: CLOUDINARY_API_SECRET,
  });

  res.status(200).json({
    status: "success",
    data: {
      downloadUrl,
      expiresIn: `${validityInMinutes} min${validityInMinutes == 1 ? "" : "s"}`,
    },
  });
}
