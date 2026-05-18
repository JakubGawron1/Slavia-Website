/**
 * Spójny multipart dla POST /api/upload — pole pliku zawsze `file`, opcjonalnie `purpose`.
 */
export function buildUploadFormData(file: File, purpose?: string): FormData {
  const fd = new FormData()
  fd.append('file', file, file.name || 'upload.jpg')
  const p = (purpose || '').trim()
  if (p) {
    fd.append('purpose', p)
  }
  return fd
}
