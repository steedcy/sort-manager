export function mergeBookMetadata(form, metadata) {
  const value = (current, incoming) => incoming == null || incoming === '' ? current : incoming
  return {
    ...form,
    name: value(form.name, metadata.title),
    description: value(form.description, metadata.description),
    imageUrl: value(form.imageUrl, metadata.coverUrl),
    bookMetadata: metadata,
  }
}
