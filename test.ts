async function isValidLink(url: string) {
  const res = await fetch(url, { method: "HEAD" });
  return res.ok;
}

console.log(
  await isValidLink(
    "https://res.cloudinary.com/extelvogroup/video/upload/v1742799922/wajanja_tv/podcasts/Liberal_Christians_vs_Conservative_Christians___Middle_Ground_wjqhqv.mp3"
  )
);
