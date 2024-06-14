const mockData = {
  data: {
    viewer: {
      login: "estruyf",
      sponsors: {
        edges: [
          {
            node: {
              name: "Elio Struyf",
              url: "https://github.com/estruyf",
              avatarUrl: "https://avatars.githubusercontent.com/u/2900833?v=4",
            },
          },
          {
            node: {
              name: "Elio Struyf",
              url: "https://github.com/estruyf",
              avatarUrl: "https://avatars.githubusercontent.com/u/2900833?v=4",
            },
          },
        ],
      },
    },
  },
};

const generateImage = async (
  sponsors: (typeof mockData)["data"]["viewer"]["sponsors"]["edges"][0]["node"][]
) => {
  if (!sponsors) {
    return null;
  }

  const images: string[] = [];

  let x = 0;
  let y = 0;
  let i = 0;

  for (const sponsor of sponsors) {
    if (!sponsor.avatarUrl) {
      continue;
    }

    const image = await fetch(sponsor.avatarUrl);

    // Fetch image and convert to base64
    const imageData = await image.blob();
    let buffer = Buffer.from(await imageData.arrayBuffer());

    images.push(`<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg" x="${x}" y="${y}">
  <title>${sponsor.name}</title>
  <circle cx="32" cy="32" fill="url('#fill${i}')" r="32" stroke="#c0c0c0" strokeWidth="1"/>
  <defs>
    <pattern height="64" id="fill${i}" patternUnits="userSpaceOnUse" width="64" x="0" y="0">
      <circle cx="32" cy="32" r="32" fill="white" />
      <image href="data:${image.headers.get(
        "content-type"
      )};base64,${buffer.toString("base64")}" height="64" width="64"/>
    </pattern>
  </defs>
</svg>`);

    x += 68;
    i++;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${x}" height="64">${images.join(
    ``
  )}</svg>`;
};
