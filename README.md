# Security With File Uploads (Cloudinary)

This repository demonstrates a **secure approach to file uploads using Cloudinary**, focusing on:

- Signed uploads
- Optional private assets
- Short-lived download URLs
- Controlled deletion of uploaded files

The goal is to avoid exposing Cloudinary secrets to the client while still allowing direct client-side uploads and downloads.

---

## What This Project Solves

File uploads are a common security risk when handled incorrectly. This project shows how to:

- Generate **time-limited upload signatures** on the server
- Upload files **directly to Cloudinary from the client**
- Store sensitive files as **private assets**
- Generate **temporary download URLs**
- Safely delete uploaded files by URL

---

## Tech Stack

- Node.js
- Express
- TypeScript
- Cloudinary
- Multer (for request parsing only)
- EJS (for demo views)

---

## Environment Variables

Create a `.env` file in the root of the project.

```env
PORT=3000

CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Project Structure

```
src/
├── controllers/
│   └── image_controller.ts   # Upload signing, deletion, downloads
├── lib/
│   ├── cloudinary.ts         # Cloudinary config
│   └── multer.ts             # Multer setup
├── utils/
│   └── groupArray.ts         # Groups array objects by key
├── views/
│   └── unsigned.ejs          # Demo upload page
├── public/
├── server.ts                 # Express server
```

---

## Core Concepts

1. **Signed Uploads (Server-Generated)**

Clients never upload with your API secret.

Instead, the client requests a signature from the server.

Endpoint:

```bash
GET /upload-signature
```

Optional query param:

```bash
should_secure_asset=true
```

What happens:

- A timestamp is generated with a limited validity window
- Upload parameters are defined on the server
- A Cloudinary signature is created using the API secret
- The client uses this signature to upload directly to Cloudinary

Response example:

```json
{
  "status": "success",
  "data": {
    "payload": {
      "timestamp": 1720000000,
      "folder": "kyc/1",
      "use_filename": true,
      "type": "private"
    },
    "signature": "generated_signature",
    "manualSignature": "manually_generated_signature",
    "cloudname": "your_cloud_name",
    "apiKey": "your_api_key",
    "expiresIn": "30 mins"
  }
}
```

I included both cloudinary’s built-in signature method (`signature`) and a manual SHA-1 implementation (`manualSignature`) for learning and verification purposes, both serve the same purpose.


2. **Private vs Public Assets**

If should_secure_asset=true is passed:

- The uploaded file is stored as a private Cloudinary asset
- The file cannot be accessed directly by URL
- Access requires a signed download URL

This is useful for:
- KYC documents
- IDs
- Private user files

```
Note: If you intend on using this code in a production environment,
the client should not be able to set this query param, instead you can
create a middlewareand set it manually in the backend for specific
file upload request endpoints.
```

3. **Temporary Download URLs**

Private files are accessed using short-lived URLs.

Endpoint:
```bash
GET /download-url
```

Query params:
```bash
public_id=<cloudinary_public_id>
format=<file_extension>
```

What happens:

A download URL valid for 1 minute is generated

After expiration, the URL becomes invalid

Response example:

```json
{
  "status": "success",
  "data": {
    "downloadUrl": "https://res.cloudinary.com/...",
    "expiresIn": "1 min"
  }
}
```

This prevents:
- Link sharing
- Permanent exposure of sensitive files

4. Deleting Files Safely

Endpoint:

```
DELETE /delete-files
```
Request body:
```javascript
{
  "urls": [
    {
      "type": "image",
      "url": "https://res.cloudinary.com/..."
    }
  ]
}
```

Validation rules:

- urls must be an array
- Each item must include:
    - type: image | video | raw
    - url: must be a valid HTTPS Cloudinary URL

What happens:
- URLs are grouped by resource type
- Public IDs are extracted safely
- Files are deleted using Cloudinary’s Admin API

This prevents accidental or malicious deletion requests.

## Routes Summary

| Method | Route             | Description                     |
| ------ | ----------------- | ------------------------------- |
| GET    | /upload-signature | Generate upload signature       |
| GET    | /download-url     | Generate temporary download URL |
| DELETE | /delete-files     | Delete uploaded files           |
| GET    | /unsigned         | Demo upload page                |

## Running the Project

Before running the project, ensure you have setup you .env file with the necessary credentials. See the **Environment Variables** section above for more details.

Install dependencies:
```bash
npm install
```

Start the server:
```bash
npm run dev
```

The app will run on:
```bash
http://localhost:3000
```

## Security Highlights

- No API secrets exposed to the client
- Time-bound upload signatures
- Optional private asset storage
- Expiring download URLs
- Strict request validation
- Controlled file deletion

## Use Cases

- KYC document uploads
- User profile images with controlled access
- Secure document storage
- Any app requiring client-side uploads with server-side security

## License

MIT License
