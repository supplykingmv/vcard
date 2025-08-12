'use client'
import { useEffect, useRef, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ContactCard } from "@/components/contact-card";
import html2canvas from "html2canvas";

export default function BusinessCardPage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const [user, setUser] = useState<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchUser() {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        setUser(userDoc.data());
      }
    }
    fetchUser();
  }, [userId]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { backgroundColor: "#fff", scale: 2 });
    const link = document.createElement("a");
    link.download = `${user.name.replace(/\s+/g, "_")}_business_card.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
  };

  if (!user) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
      <div ref={cardRef} className="mb-6">
        <ContactCard
          contact={{
            id: userId,
            name: user.name,
            email: user.email,
            phone: user.phone,
            company: "",
            title: "",
            category: "Personal",
            dateAdded: new Date(),
            notes: "",
            website: user.website,
            address: user.address,
          }}
          onEdit={() => {}}
          onDelete={() => {}}
          onShare={() => {}}
          showActions={false}
        />
      </div>
      <button
        onClick={handleDownload}
        className="px-6 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700"
      >
        Save Business Card as Image
      </button>
    </div>
  );
} 