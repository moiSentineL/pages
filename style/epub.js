async function downloadEpub() {
  const { zipSync, strToU8 } = await import("https://cdn.jsdelivr.net/npm/fflate@0.8.2/esm/browser.js");

  const title    = document.querySelector("h1.title")?.textContent?.trim() ?? "Untitled";
  const date     = document.querySelector("time")?.getAttribute("datetime") ?? "";
  const excerpt  = document.querySelector("h4.excerpt")?.textContent?.trim() ?? "";
  const content  = document.querySelector("article")?.innerHTML ?? "";
  const author   = "Nibir Sankar";
  const uuid     = crypto.randomUUID();
  const slug     = title.toLowerCase().replace(/[^\w]+/g, "-");

  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escXml(title)}</dc:title>
    <dc:creator>${escXml(author)}</dc:creator>
    <dc:date>${date.slice(0, 10)}</dc:date>
    <dc:description>${escXml(excerpt)}</dc:description>
    <dc:language>en</dc:language>
    <dc:identifier id="uid">${uuid}</dc:identifier>
  </metadata>
  <manifest>
    <item id="content" href="content.html" media-type="application/xhtml+xml"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="style.css" media-type="text/css"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="content"/>
  </spine>
</package>`;

  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${uuid}"/>
  </head>
  <docTitle><text>${escXml(title)}</text></docTitle>
  <navMap>
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel><text>${escXml(title)}</text></navLabel>
      <content src="content.html"/>
    </navPoint>
  </navMap>
</ncx>`;

  const contentHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${escXml(title)}</title>
  <link rel="stylesheet" href="style.css"/>
</head>
<body>
  <h1>${escXml(title)}</h1>
  ${excerpt ? `<p class="excerpt"><em>${escXml(excerpt)}</em></p><hr/>` : ""}
  ${content}
</body>
</html>`;

  const css = `
body { font-family: Georgia, serif; font-size: 1em; line-height: 1.7; margin: 2em; color: #111; }
h1 { font-size: 1.5em; margin-bottom: 0.25em; }
h2, h3 { margin-top: 1.5em; }
p { margin: 0.8em 0; }
a { color: #111; }
hr { border: none; border-top: 1px solid #ccc; margin: 1.5em 0; }
.excerpt { color: #555; font-style: italic; }
blockquote { border-left: 3px solid #ccc; padding-left: 1em; color: #444; }
code, pre { font-family: monospace; background: #f4f4f4; padding: 0.2em 0.4em; }
pre { padding: 1em; overflow-x: auto; }
`;

  // mimetype must be first and uncompressed per EPUB spec
  const mimetypeFile = zipSync(
    { "mimetype": strToU8("application/epub+zip") },
    { level: 0 }
  );

  const rest = zipSync({
    "META-INF/container.xml": strToU8(`<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`),
    "OEBPS/content.opf":  strToU8(contentOpf),
    "OEBPS/toc.ncx":      strToU8(tocNcx),
    "OEBPS/content.html": strToU8(contentHtml),
    "OEBPS/style.css":    strToU8(css),
  }, { level: 9 });

  // Concatenate: mimetype bytes first, then the rest
  const merged = new Uint8Array(mimetypeFile.length + rest.length);
  merged.set(mimetypeFile, 0);
  merged.set(rest, mimetypeFile.length);

  const blob = new Blob([merged], { type: "application/epub+zip" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${slug}.epub`;
  a.click();
  URL.revokeObjectURL(url);
}

function escXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

window.downloadEpub = downloadEpub;
