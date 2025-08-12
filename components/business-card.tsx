"use client"

import type { Contact } from "@/types/contact"

interface BusinessCardProps {
  contact: Contact
}

export function BusinessCard({ contact }: BusinessCardProps) {
  return (
    <div
      id="business-card"
      className="bg-gradient-to-br from-green-500 to-green-600 text-white relative overflow-hidden"
      style={{
        width: "345px",
        height: "240px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url('/line-pattern.png')`,
          backgroundSize: "100px 100px",
          backgroundRepeat: "repeat",
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {contact.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">{contact.name}</h1>
              <p className="text-sm text-green-100">{contact.title}</p>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white p-1 rounded">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(`BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
ORG:${contact.company}
TEL:${contact.phone}
EMAIL:${contact.email}
ADR:;;${contact.address || ""};;;;
NOTE:${contact.notes || ""}
END:VCARD`)}`}
              alt={`QR Code for ${contact.name}`}
              className="w-12 h-12"
            />
          </div>
        </div>

        {/* Company */}
        <div className="mb-3">
          <h2 className="text-base font-semibold text-green-100">{contact.company}</h2>
        </div>

        {/* Contact Info */}
        <div className="space-y-1 text-sm flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-green-200">📧</span>
            <span className="text-white">{contact.email}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-200">📱</span>
            <span className="text-white">{contact.phone}</span>
          </div>
          {contact.address && (
            <div className="flex items-start space-x-2">
              <span className="text-green-200">📍</span>
              <span className="text-white text-xs leading-tight">{contact.address}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {contact.notes && (
          <div className="mt-2 pt-2 border-t border-green-400/30">
            <p className="text-xs text-green-100 italic">"{contact.notes}"</p>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-2 right-2">
          <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">{contact.category}</span>
        </div>
      </div>
    </div>
  )
}
