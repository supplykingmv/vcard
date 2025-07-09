"use client"

import * as React from "react"

import { useState, useCallback, useEffect } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Contact } from "@/types/contact"
import dynamic from "next/dynamic"
import { BrowserQRCodeReader } from '@zxing/browser'

// QRCodeScanner component for camera mode
function QRCodeScanner({ onScan, onError, deviceId }: { onScan: (text: string) => void, onError: (err: string) => void, deviceId?: string }) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const codeReaderRef = React.useRef<BrowserQRCodeReader | null>(null)
  React.useEffect(() => {
    const codeReader = new BrowserQRCodeReader()
    codeReaderRef.current = codeReader
    let stop = false
    async function start() {
      try {
        let selectedDeviceId = deviceId
        if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices()
          selectedDeviceId = deviceId || videoInputDevices[0]?.deviceId
        }
        await codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current!, (result, err) => {
          if (result) {
            onScan(result.getText())
            if ((codeReader as any).reset) (codeReader as any).reset()
            else if ((codeReader as any).stopContinuousDecode) (codeReader as any).stopContinuousDecode()
          } else if (err && err.message) {
            if (!err.name.includes('NotFoundException')) {
              onError(err.message)
            }
          }
        })
      } catch (e: any) {
        onError(e.message || 'Camera error')
      }
    }
    start()
    return () => {
      stop = true
      if (codeReaderRef.current) {
        if ((codeReaderRef.current as any).reset) (codeReaderRef.current as any).reset()
        else if ((codeReaderRef.current as any).stopContinuousDecode) (codeReaderRef.current as any).stopContinuousDecode()
      }
    }
  }, [deviceId])
  return <video ref={videoRef} style={{ width: '100%', borderRadius: 12 }} />
}

interface QRScannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onContactScanned: (contact: Omit<Contact, "id" | "dateAdded">) => void
}

const QrReader = dynamic(() => import("react-qr-reader").then(mod => mod.QrReader), { ssr: false })

export function QRScannerDialog({ open, onOpenChange, onContactScanned }: QRScannerDialogProps) {
  const [scanMode, setScanMode] = useState<"camera" | "upload" | "manual">("manual")
  const [manualData, setManualData] = useState("")
  const [showCamera, setShowCamera] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (scanMode !== "camera" || !open) {
      setShowCamera(false)
      setCameraError(null)
      setSelectedDeviceId(undefined)
    }
  }, [scanMode, open])

  // Fetch available video input devices when camera is requested
  useEffect(() => {
    if (!mounted) return
    if (showCamera) {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        setCameraError('Camera device enumeration is not supported in this browser. Try using the latest Safari or Chrome, or use file upload/manual entry.')
        setDevices([])
        return
      }
      navigator.mediaDevices.enumerateDevices().then((allDevices) => {
        setDevices(allDevices.filter((d) => d.kind === "videoinput"))
      })
    }
  }, [showCamera, mounted])

  const parseVCard = (vCardData: string) => {
    const lines = vCardData.split("\n")
    const contact: any = {
      name: "",
      title: "",
      company: "",
      email: "",
      phone: "",
      category: "Work" as Contact["category"],
      notes: "",
      website: "",
      address: "",
      emails: [],
      phones: [],
    }

    lines.forEach((line) => {
      if (!line.trim()) return
      const [rawKey, ...rest] = line.split(":")
      const value = rest.join(":").trim()
      if (!value) return
      const key = rawKey.split(";")[0].toUpperCase()

      switch (key) {
        case "FN":
          contact.name = value
          break
        case "N":
          if (!contact.name || !contact.name.trim()) {
            const parts = value.split(";")
            if (parts.length >= 2) {
              const first = parts[1]?.trim() || ""
              const last = parts[0]?.trim() || ""
              contact.name = [first, last].filter(Boolean).join(" ")
            } else {
              contact.name = value.trim()
            }
          }
          break
        case "ORG":
          contact.company = value
          break
        case "TITLE":
          contact.title = value
          break
        case "EMAIL":
          contact.emails.push(value)
          break
        case "TEL":
          contact.phones.push(value)
          break
        case "NOTE":
          contact.notes = value
          break
        case "URL":
          contact.website = value
          break
        case "ADR":
          contact.address = value.replace(/;;|;;;;/g, "").trim()
          break
      }
    })

    // Use the first email/phone if available
    if (contact.emails.length > 0) contact.email = contact.emails[0]
    if (contact.phones.length > 0) contact.phone = contact.phones[0]

    return contact
  }

  const handleManualInput = () => {
    try {
      // Try to parse as vCard first
      if (manualData.includes("BEGIN:VCARD")) {
        const contact = parseVCard(manualData)
        if (contact.name && contact.email) {
          onContactScanned(contact)
          onOpenChange(false)
          setManualData("")
          return
        }
      }

      // Try to parse as JSON
      const jsonData = JSON.parse(manualData)
      if (jsonData.name && jsonData.email) {
        onContactScanned({
          ...jsonData,
          category: jsonData.category || "Work",
        })
        onOpenChange(false)
        setManualData("")
      }
    } catch (error) {
      alert("Invalid contact data format. Please check your input.")
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setManualData(text)
      }
      reader.readAsText(file)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Scan QR Code</DialogTitle>
          <DialogDescription>Add a contact by scanning a QR code or entering contact data</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={scanMode === "manual" ? "default" : "outline"}
              size="sm"
              onClick={() => setScanMode("manual")}
              className={scanMode === "manual" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              Manual Input
            </Button>
            <Button
              variant={scanMode === "upload" ? "default" : "outline"}
              size="sm"
              onClick={() => setScanMode("upload")}
              className={scanMode === "upload" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Upload className="h-4 w-4 mr-1" />
              Upload File
            </Button>
            <Button
              variant={scanMode === "camera" ? "default" : "outline"}
              size="sm"
              onClick={() => setScanMode("camera")}
              className={scanMode === "camera" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              Camera
            </Button>
          </div>

          {/* Manual Input Mode */}
          {scanMode === "manual" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-data">Contact Data</Label>
                <textarea
                  id="manual-data"
                  value={manualData}
                  onChange={(e) => setManualData(e.target.value)}
                  placeholder="Paste vCard data or JSON contact information here..."
                  className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-[#36deb2] focus:border-transparent"
                />
              </div>
              <div className="text-xs text-gray-500">
                <p className="mb-2">Supported formats:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>vCard format (BEGIN:VCARD...END:VCARD)</li>
                  <li>JSON format with name, email, phone, etc.</li>
                </ul>
              </div>
            </div>
          )}

          {/* File Upload Mode */}
          {scanMode === "upload" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Upload Contact File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".vcf,.txt,.json"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
              </div>
              <div className="text-xs text-gray-500">Supported file types: .vcf (vCard), .txt, .json</div>
              {manualData && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">File Content Preview:</p>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {manualData.substring(0, 500)}
                    {manualData.length > 500 && "..."}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Camera Scan Mode */}
          {scanMode === "camera" && mounted && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Scan QR Code</Label>
                <div>
                  {devices.length > 1 && (
                    <select
                      value={selectedDeviceId || devices[0]?.deviceId}
                      onChange={(e) => setSelectedDeviceId(e.target.value)}
                      style={{ marginBottom: 8 }}
                    >
                      {devices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${device.deviceId}`}
                        </option>
                      ))}
                    </select>
                  )}
                  <QRCodeScanner
                    deviceId={selectedDeviceId}
                    onScan={(text) => {
                      setCameraError(null)
                      setManualData(text)
                      setScanMode("manual")
                      try {
                        const contact = JSON.parse(text)
                        onContactScanned(contact)
                      } catch {
                        setCameraError("Scanned QR code is not valid contact data.")
                      }
                    }}
                    onError={(err) => {
                      if (err.includes('denied')) {
                        setCameraError('Camera access denied. Please allow camera permissions in your browser settings.')
                      } else if (err.includes('not found')) {
                        setCameraError('No camera device found. If you are on iOS, try using Safari or check permissions in Settings > Safari > Camera.')
                      } else {
                        setCameraError(err)
                      }
                    }}
                  />
                  {cameraError && (
                    <div style={{ color: "red", marginTop: 8 }}>{cameraError}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">If you have issues on iOS, make sure you are using Safari and have granted camera permissions in Settings.</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleManualInput}
              disabled={!manualData.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Add Contact
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
