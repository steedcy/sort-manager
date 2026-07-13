import { useState, useRef } from 'react'
import { X, Image } from 'lucide-react'
import { uploadApi } from '../api'
import toast from 'react-hot-toast'

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
    <div>
      {value ? (
        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
          <img
            src={value}
            alt="preview"
            style={{
              width: '100%', maxHeight: '180px', objectFit: 'cover',
              borderRadius: '10px', border: '1px solid var(--border-default)',
              display: 'block',
            }}
          />
          <button
            onClick={() => onChange('')}
            style={{
              position: 'absolute', top: '8px', right: '8px',
              background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%',
              width: '28px', height: '28px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: '#fff',
            }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: '2px dashed var(--border-strong)',
            borderRadius: '12px', padding: '32px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '8px',
            cursor: 'pointer', transition: 'all 0.2s',
            color: 'var(--text-subtle)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.55)'
            e.currentTarget.style.background = 'var(--bg-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-strong)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          {uploading
            ? <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>上传中...</div>
            : <>
                <Image size={28} style={{ color: 'var(--empty-icon-color)' }} />
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>点击上传图片</div>
                <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>支持 JPG、PNG、GIF，最大 10MB</div>
              </>
          }
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  )
}
