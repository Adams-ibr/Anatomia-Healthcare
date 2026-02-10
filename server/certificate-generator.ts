import PDFDocument from "pdfkit";
import type { Certificate, Course, Member } from "../shared/schema";

interface CertificateData {
  certificate: Certificate;
  course: Course;
  member: Member;
}

export function generateCertificatePDF(data: CertificateData): typeof PDFDocument.prototype {
  const { certificate, course, member } = data;
  
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  });

  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const centerX = pageWidth / 2;

  doc.rect(20, 20, pageWidth - 40, pageHeight - 40).lineWidth(3).stroke("#1e3a5f");
  doc.rect(30, 30, pageWidth - 60, pageHeight - 60).lineWidth(1).stroke("#3b82f6");

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#1e3a5f")
    .text("ANATOMIA", centerX - 50, 60, { width: 100, align: "center" });

  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor("#64748b")
    .text("Medical Education Platform", 50, 80, { width: pageWidth - 100, align: "center" });

  doc
    .font("Helvetica-Bold")
    .fontSize(36)
    .fillColor("#1e3a5f")
    .text("Certificate of Completion", 50, 130, { width: pageWidth - 100, align: "center" });

  doc.moveTo(centerX - 150, 185).lineTo(centerX + 150, 185).lineWidth(2).stroke("#3b82f6");

  doc
    .font("Helvetica")
    .fontSize(14)
    .fillColor("#475569")
    .text("This is to certify that", 50, 210, { width: pageWidth - 100, align: "center" });

  const memberName = member.firstName && member.lastName 
    ? `${member.firstName} ${member.lastName}`
    : member.email;

  doc
    .font("Helvetica-Bold")
    .fontSize(32)
    .fillColor("#0f172a")
    .text(memberName, 50, 240, { width: pageWidth - 100, align: "center" });

  doc.moveTo(centerX - 200, 290).lineTo(centerX + 200, 290).lineWidth(1).stroke("#cbd5e1");

  doc
    .font("Helvetica")
    .fontSize(14)
    .fillColor("#475569")
    .text("has successfully completed the course", 50, 310, { width: pageWidth - 100, align: "center" });

  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .fillColor("#1e3a5f")
    .text(course.title, 50, 340, { width: pageWidth - 100, align: "center" });

  if (course.level) {
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#64748b")
      .text(`Level: ${course.level.charAt(0).toUpperCase() + course.level.slice(1)}`, 50, 375, { width: pageWidth - 100, align: "center" });
  }

  const completedDate = certificate.issuedAt 
    ? new Date(certificate.issuedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor("#64748b")
    .text(`Issued on: ${completedDate}`, 50, 420, { width: pageWidth - 100, align: "center" });

  doc.moveTo(centerX - 100, 480).lineTo(centerX + 100, 480).lineWidth(1).stroke("#0f172a");
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#475569")
    .text("Authorized Signature", centerX - 100, 485, { width: 200, align: "center" });

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#94a3b8")
    .text(`Certificate ID: ${certificate.certificateNumber}`, 50, pageHeight - 60, { width: pageWidth - 100, align: "center" });

  doc
    .fontSize(8)
    .fillColor("#94a3b8")
    .text("Verify this certificate at anatomia.com/verify", 50, pageHeight - 45, { width: pageWidth - 100, align: "center" });

  return doc;
}

export function generateCertificateNumber(): string {
  const prefix = "ANAT";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
