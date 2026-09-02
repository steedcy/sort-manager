import { useEffect, useRef, useState } from 'react'
import { BarcodeFormat, BrowserMultiFormatReader } from '@zxing/browser'
import { DecodeHintType } from '@zxing/library'

const scannerConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
}

function scannerErrorMessage(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
    return '未获得摄像头权限。请在浏览器的网站设置中允许使用摄像头后重试。'
  }
  if (error?.name === 'NotFoundError') return '未发现可用摄像头。请确认设备具有摄像头后重试。'
  return '无法打开摄像头。你可以重新尝试，或手动输入 ISBN。'
}

export default function BookBarcodeScanner({ onDetected }) {
  const videoRef = useRef(null)
  const [message, setMessage] = useState('正在打开摄像头…')
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let active = true
    let controls

    const stop = () => controls?.stop()
    const start = async () => {
      if (!window.isSecureContext) {
        setHasError(true)
        setMessage('局域网扫码需要使用 HTTPS 安全地址访问。')
        return
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setHasError(true)
        setMessage('当前浏览器不支持网页摄像头。请手动输入或粘贴 ISBN。')
        return
      }

      try {
        const hints = new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]]])
        const reader = new BrowserMultiFormatReader(hints)
        controls = await reader.decodeFromConstraints(scannerConstraints, videoRef.current, (result) => {
          if (!active || !result) return
          const rawValue = result.getText()?.trim()
          if (!rawValue) return
          active = false
          stop()
          onDetected(rawValue)
        })
        if (!active) stop()
        else setMessage('请将图书背面的条码放入取景框。')
      } catch (error) {
        if (!active) return
        setHasError(true)
        setMessage(scannerErrorMessage(error))
      }
    }

    start()
    return () => {
      active = false
      stop()
    }
  }, [onDetected])

  return (
    <div className="book-barcode-scanner">
      <video ref={videoRef} autoPlay playsInline muted className="book-barcode-scanner__video" />
      <p className="book-barcode-scanner__hint" role={hasError ? 'alert' : 'status'} aria-live="polite">{message}</p>
    </div>
  )
}
