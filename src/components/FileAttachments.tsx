import React, { useState } from 'react'
import { Download, FileText, Image, Video, Music, Archive, File, ExternalLink, Copy, Check } from 'lucide-react'

interface FileAttachmentsProps {
  files: string[]
}

export function FileAttachments({ files }: FileAttachmentsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  if (!files || files.length === 0) {
    return null
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
        return <FileText className="w-5 h-5" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <Image className="w-5 h-5" />
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return <Video className="w-5 h-5" />
      case 'mp3':
      case 'wav':
      case 'flac':
        return <Music className="w-5 h-5" />
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className="w-5 h-5" />
      default:
        return <File className="w-5 h-5" />
    }
  }

  const getFileName = (url: string) => {
    try {
      // Extract filename from URL
      const urlParts = url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      return decodeURIComponent(fileName) || 'Unknown file'
    } catch {
      return 'Unknown file'
    }
  }

  const getFileSize = (fileName: string) => {
    // Mock file size for display - in a real app you'd get this from metadata
    const extensions = fileName.split('.').pop()?.toLowerCase()
    switch (extensions) {
      case 'pdf':
        return '2.3 MB'
      case 'doc':
      case 'docx':
        return '1.1 MB'
      case 'txt':
        return '15 KB'
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '850 KB'
      case 'zip':
        return '5.2 MB'
      default:
        return '1.5 MB'
    }
  }

  const handleDownload = (url: string, fileName: string) => {
    // Create a temporary anchor element with download attribute
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.style.display = 'none'
    
    // Add to DOM, click, and remove
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleView = (url: string) => {
    // Open in new window/tab
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const copyLink = async (url: string, index: number) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
      } catch (err) {
        console.error('Fallback copy failed:', err)
      }
      document.body.removeChild(textArea)
    }
  }

  const isImageFile = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')
  }

  const isPDFFile = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    return extension === 'pdf'
  }

  return (
    <div className="px-4 pb-3">
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <FileText className="w-4 h-4 mr-2" />
          Attachments ({files.length})
        </h4>
        
        <div className="space-y-2">
          {files.map((fileUrl, index) => {
            const fileName = getFileName(fileUrl)
            const fileSize = getFileSize(fileName)
            const isImage = isImageFile(fileName)
            const isPDF = isPDFFile(fileName)
            
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="text-gray-500 flex-shrink-0">
                    {getFileIcon(fileName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {fileSize} • {isImage ? 'Image file' : isPDF ? 'PDF document' : 'File attachment'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={() => handleView(fileUrl)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Open file in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDownload(fileUrl, fileName)}
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => copyLink(fileUrl, index)}
                    className={`p-2 rounded-full transition-colors ${
                      copiedIndex === index
                        ? 'text-green-600 bg-green-50'
                        : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                    title={copiedIndex === index ? 'Link copied!' : 'Copy link'}
                  >
                    {copiedIndex === index ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Help text */}
        <div className="mt-3 p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 <strong>Tip:</strong> If download doesn't work, try right-clicking the "Open" button and select "Save link as..." or use the copy link option to access the file directly.
          </p>
        </div>
      </div>
    </div>
  )
}
