export type ContactReason = {
  id: string
  label: string
}

export const contactReasons: ContactReason[] = [
  { id: "product", label: "Product inquiries" },
  { id: "tracking", label: "Order tracking" },
  { id: "returns", label: "Return & refund requests" },
  { id: "bulk", label: "Bulk purchase queries" },
  { id: "feedback", label: "General feedback" },
]

export const contactInfo = {
  phone: {
    display: "+91 9925819694",
    href: "tel:+919925819694",
  },
  email: {
    display: "customercare@toycker.com",
    href: "mailto:customercare@toycker.com",
  },
  address:
    "KESHAV ENTERPRISE\nGROUND FLOOR, PLOT NO. 76, NILAMNAGAR SOCIETTY-2, PUNA SIMADA ROAD, PUNAGAM, Surat, Gujarat, 395010",
  hours: {
    weekdays: "Monday – Saturday: 10:00 AM – 7:00 PM",
    sunday: "Sunday: Closed",
  },
}
