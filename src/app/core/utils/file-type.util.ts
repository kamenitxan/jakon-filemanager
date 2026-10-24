const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'];

function extensionOf(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx === -1 ? '' : name.slice(idx + 1).toLowerCase();
}

/** Whether `name`'s extension is one the preview dialog/grid can render as an `<img>`. */
export function isImageFile(name: string): boolean {
  return IMAGE_EXTENSIONS.includes(extensionOf(name));
}
