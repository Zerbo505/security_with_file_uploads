const dropbox = document.querySelector(".dropbox");
const fileInput = document.querySelector('input[type="file"]');
const dropboxText = document.querySelector(".dropbox h1");
const preview = document.getElementById("preview");
const imageUploadBtn = document.getElementById("img-upload-btn");

const cloudinaryUrl =
  "https://api.cloudinary.com/v1_1/extelvogroup/image/upload";
const cloudinaryApiKey = "682398265466428";

let selectedFiles = [];

// console.log({ dropbox, fileInput });

dropbox.addEventListener("dragenter", (e) => {
  dropbox.classList.add("dropbox-hover");
});

dropbox.addEventListener("dragleave", (e) => {
  dropbox.classList.remove("dropbox-hover");
});

dropbox.addEventListener("dragover", (e) => {
  e.preventDefault();
});

dropbox.addEventListener("drop", (e) => {
  e.preventDefault();
  console.log({ message: "Dropped some items in the drop zone", e });

  const files = e.dataTransfer.files;

  selectedFiles = [];
  for (const file of files) {
    if (file.type.startsWith("image/")) {
      selectedFiles.push(file);
    }
  }

  if (!!selectedFiles.length) {
    dropboxText.textContent = `${selectedFiles.length} file${
      selectedFiles.length == 1 ? "" : "s"
    } selected`;
  }

  for (const img of preview.querySelectorAll("img")) {
    console.log({ img, src: img.src });
    URL.revokeObjectURL(img.src);
  }

  preview.replaceChildren();

  for (const file of selectedFiles) {
    const li = document.createElement("li");
    const img = document.createElement("img");
    const p = document.createElement("p");
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    img.style.width = "10rem";
    img.style.aspectRatio = "16/9";
    img.style.objectFit = "cover";
    p.textContent = file.name.substring(0, 20);

    li.appendChild(img);
    li.appendChild(p);
    preview.appendChild(li);
  }

  //   selectedFiles = files;

  console.log({ files });
});

imageUploadBtn.addEventListener("click", async (e) => {
  if (!selectedFiles.length) {
    alert("Please drag and drop some files into the drop zone!");
  }

  console.log({ filesToUpload: selectedFiles });

  const uploadResults = await Promise.all(
    selectedFiles.map((file) => uploadFileSigned(file))
  );

  console.log({ uploadResults });
});

async function uploadFileUnsigned(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "vs-code-preset");
  const res = await fetch(cloudinaryUrl, { method: "POST", body: formData });

  if (!res.ok) {
    // console.log({ res, json: await res.json() });
    const response = await res.json();
    throw new Error(
      response?.error?.message ?? "An error occured while uploading your image"
    );
  }

  return res.json();
}
async function uploadFileSigned(file) {
  const formData = new FormData();
  formData.append("file", file);
//   formData.append("upload_preset", "vs-code-preset");
  const res = await fetch(cloudinaryUrl, { method: "POST", body: formData });

  if (!res.ok) {
    const response = await res.json();
    throw new Error(
      response?.error?.message ?? "An error occured while uploading your image"
    );
  }

  return res.json();
}
