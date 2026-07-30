import { useState, useRef } from 'react'
import { X, Image } from 'lucide-react'
import { uploadApi } from '../api'
import toast from 'react-hot-toast'
import AuthImage from './AuthImage'

export default function ImageUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef()

  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('请上传图片文件'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('图片不能超过10MB'); return }
    setUploading(true)
    try {
      const res = await uploadApi.upload(file)
      onChange(res.data.url)
      toast.success('图片上传成功')
    } catch {
      // handled by interceptor
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="image-upload">
      {value ? (
        <div className="image-upload__preview">
          <AuthImage
            src={value}
            alt="preview"
            fallback={<div className="upload-preview-fallback">图片暂时无法显示</div>}
            className="image-upload__image"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="移除已上传图片"
            className="image-upload__remove"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              inputRef.current?.click()
            }
          }}
          aria-label="选择要上传的图片"
          className="image-upload__dropzone"
        >
          {uploading
            ? <div className="image-upload__status">上传中...</div>
            : <>
                <Image size={28} className="image-upload__icon" aria-hidden="true" />
                <div className="image-upload__label">点击上传图片</div>
                <div className="image-upload__hint">支持 JPG、PNG、GIF，最大 10MB</div>
              </>
          }
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  )
}
