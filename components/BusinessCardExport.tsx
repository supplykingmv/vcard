import type { Contact } from "@/types/contact"
import { QRCodeCanvas } from "qrcode.react"
import { Mail, Phone, Building } from "lucide-react"

export function BusinessCardExport({ contact }: { contact: Contact }) {
  return (
    <div
      style={{
        width: 326,
        height: 202,
        background: "#fff",
        borderRadius: 12,
        boxSizing: "border-box",
        fontFamily: "system-ui, -apple-system, sans-serif",
        border: "1px solid #e5e7eb",
        padding: 18,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      }}
    >
      {/* Header: Name, Title, Ministry, QR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#222", marginBottom: 0 }}>{contact.name}</div>
          <div style={{ color: "#666", fontSize: 13, marginBottom: 2 }}>{contact.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Building size={14} style={{ color: "#8ca0b3", marginRight: 2 }} />
            <span style={{ fontWeight: 600, fontSize: 13, color: "#8ca0b3", lineHeight: 1 }}>{contact.company}</span>
          </div>
        </div>
        <div style={{ marginLeft: 12, marginTop: 2 }}>
          <QRCodeCanvas
            value={`BEGIN:VCARD\nVERSION:3.0\nFN:${contact.name}\nORG:${contact.company}\nTITLE:${contact.title}\nTEL:${contact.phone}\nEMAIL:${contact.email}\nADR:;;${contact.address || ""};;;;\nURL:${contact.website || ""}\nEND:VCARD`}
            size={56}
            level="M"
            includeMargin={false}
            style={{ background: '#fff', borderRadius: 8 }}
          />
        </div>
      </div>
      {/* Contact Info */}
      <div style={{ marginTop: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#059669", fontSize: 13, marginBottom: 2 }}>
          <Mail size={14} style={{ marginRight: 2 }} />
          <span style={{ fontWeight: 500, wordBreak: 'break-all' }}>{contact.email}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#059669", fontSize: 13, marginBottom: 2 }}>
          <Phone size={14} style={{ marginRight: 2 }} />
          <span style={{ fontWeight: 500 }}>{contact.phone}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#8ca0b3", fontSize: 13, marginTop: 2 }}>
          <span style={{ fontSize: 15, marginRight: 2 }}>📍</span>
          <span style={{ fontWeight: 400, color: '#3b3b3b' }}>{contact.address}</span>
        </div>
      </div>
    </div>
  )
} 