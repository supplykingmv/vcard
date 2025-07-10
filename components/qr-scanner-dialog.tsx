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

// QRCodeScanner component for camera mode using react-qr-reader
function QRCodeScanner({ onScan, onError }: { onScan: (text: string) => void, onError: (err: string) => void }) {
  React.useEffect(() => {
    console.log("QrReader mounted");
  }, []);

  const fatalCameraErrors = [
    "NotAllowedError",
    "NotReadableError",
    "OverconstrainedError",
    "StreamApiNotSupportedError",
    "NotFoundError",
    "NotSupportedError",
    "AbortError",
    "SecurityError",
    "TypeError"
  ];

  const handleResult = (result: any, error: any) => {
    if (result?.text) {
      onScan(result.text);
    } else if (
      error &&
      (
        fatalCameraErrors.includes(error.name) ||
        (typeof error.message === "string" && (
          error.message.toLowerCase().includes("permission") ||
          error.message.toLowerCase().includes("not allowed") ||
          error.message.toLowerCase().includes("not readable") ||
          error.message.toLowerCase().includes("not found") ||
          error.message.toLowerCase().includes("not supported") ||
          error.message.toLowerCase().includes("abort") ||
          error.message.toLowerCase().includes("security") ||
          error.message.toLowerCase().includes("typeerror")
        ))
      )
    ) {
      onError(error.message || 'Camera error');
    }
    // Otherwise, ignore the error (likely just no QR code found in frame)
  };

  return (
    <div style={{ width: '100%', borderRadius: 12 }}>
      <QrReader
        onResult={handleResult}
        constraints={{ facingMode: 'environment' }}
      />
      <noscript>
        <div style={{ color: 'red', marginTop: 8 }}>Camera not available or permission denied.</div>
      </noscript>
    </div>
  );
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
  const [scanned, setScanned] = useState(false)
  const [scannedContact, setScannedContact] = useState<Omit<Contact, "id" | "dateAdded"> | null>(null);
  // Reset scanned when dialog is reopened or scan mode changes
  useEffect(() => { setScanned(false) }, [open, scanMode])
  // Reset scannedContact when dialog is reopened or scan mode changes
  useEffect(() => { setScannedContact(null); }, [open, scanMode]);
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (scanMode !== "camera" || !open) {
      setShowCamera(false)
      setCameraError(null)
      setSelectedDeviceId(undefined)
    }
  }, [scanMode, open])

  // Clear manualData when dialog is closed
  useEffect(() => {
    if (!open) setManualData("")
  }, [open])

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

  // Enhanced onOpenChange to always stop camera
  const handleOpenChange = (open: boolean) => {
    setShowCamera(false);
    onOpenChange(open);
  };

  const handleManualInput = () => {
    try {
      // Try to parse as vCard first
      if (manualData.includes("BEGIN:VCARD")) {
        const contact = parseVCard(manualData)
        if (contact.name && contact.email) {
          onContactScanned(contact)
          setManualData("")
          setScanMode("manual")
          setShowCamera(false)
          handleOpenChange(false)
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
        setManualData("")
        setScanMode("manual")
        setShowCamera(false)
        handleOpenChange(false)
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              disabled={!!scannedContact}
            >
              Camera
            </Button>
          </div>

          {/* Manual Input Mode */}
          {scanMode === "manual" && !scannedContact && (
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
          {scanMode === "upload" && !scannedContact && (
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
          {scanMode === "camera" && mounted && !scannedContact && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Scan QR Code</Label>
                <div>
                  {!showCamera ? (
                    <div className="space-y-4">
                      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="text-gray-500 mb-4">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Click "Start Scan" to begin QR code scanning</p>
                        <Button 
                          onClick={() => setShowCamera(true)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Start Scan
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <QRCodeScanner
                        onScan={(text) => {
                          if (scanned) return;
                          setScanned(true);
                          setCameraError(null)
                          setManualData(text); // Place scanned data in manual input
                          setShowCamera(false); // Close camera
                          setScanMode("manual"); // Switch to manual input for review/edit
                        }}
                        onError={(err) => {
                          if (err.includes('denied')) {
                            setCameraError('Camera access denied. Please allow camera permissions in your browser settings.');
                          } else if (err.includes('not found')) {
                            setCameraError('No camera device found. If you are on iOS, try using Safari or check permissions in Settings > Safari > Camera.');
                          } else {
                            setCameraError(err);
                          }
                        }}
                      />
                      {cameraError && (
                        <div style={{ color: "red", marginTop: 8 }}>{cameraError}</div>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCamera(false)}
                          className="flex-1"
                        >
                          Close Camera
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">If you have issues on iOS, make sure you are using Safari and have granted camera permissions in Settings.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Show scanned contact for confirmation */}
          {scannedContact && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-semibold text-gray-900 mb-2">Scanned Contact</h3>
                <div className="text-sm text-gray-700">
                  <div><b>Name:</b> {scannedContact.name}</div>
                  <div><b>Email:</b> {scannedContact.email}</div>
                  {scannedContact.phone && <div><b>Phone:</b> {scannedContact.phone}</div>}
                  {scannedContact.company && <div><b>Company:</b> {scannedContact.company}</div>}
                  {scannedContact.title && <div><b>Title:</b> {scannedContact.title}</div>}
                  {scannedContact.address && <div><b>Address:</b> {scannedContact.address}</div>}
                  {scannedContact.notes && <div><b>Notes:</b> {scannedContact.notes}</div>}
                  {scannedContact.website && <div><b>Website:</b> {scannedContact.website}</div>}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    onContactScanned(scannedContact);
                    setScannedContact(null);
                    setScanned(false);
                    handleOpenChange(false);
                  }}
                >
                  Create Contact
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setScannedContact(null);
                    setScanned(false);
                    handleOpenChange(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons for manual/upload */}
          {!scannedContact && (scanMode === "manual" || scanMode === "upload") && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)} className="flex-1">
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
