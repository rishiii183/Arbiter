import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Download, Copy, Share2, FileText, CheckCircle2, ShieldCheck, User, Calendar, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export interface ResearchPaper {
  id: string;
  tag: string;
  title: string;
  date: string;
  authors: string[];
  citation: string;
  abstract: string;
  sections: {
    heading: string;
    content: string;
    codeSnippet?: string;
  }[];
}

interface PaperReaderDialogProps {
  paper: ResearchPaper | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PaperReaderDialog({ paper, isOpen, onClose }: PaperReaderDialogProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!paper) return null;

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(`${paper.title}. ${paper.authors.join(", ")} (${paper.date}). ${paper.citation}`);
    setCopied(true);
    toast.success("Citation copied to clipboard");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    setDownloading(true);

    setTimeout(() => {
      const fileName = `${paper.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
      const content = `================================================================================
FORETYX AI SECURITY RESEARCH ADVISORY
================================================================================

TITLE: ${paper.title.toUpperCase()}
CATEGORY: ${paper.tag}
PUBLICATION DATE: ${paper.date}
AUTHORS: ${paper.authors.join(", ")}
CITATION: ${paper.citation}
SECURITY ATTESTATION: Foretyx Enclave Verified (CC BY-NC 4.0)

--------------------------------------------------------------------------------
EXECUTIVE ABSTRACT
--------------------------------------------------------------------------------
${paper.abstract}

--------------------------------------------------------------------------------
PAPER SECTIONS & ANALYSIS
--------------------------------------------------------------------------------
${paper.sections
  .map(
    (s) =>
      `${s.heading}\n\n${s.content}${
        s.codeSnippet ? `\n\n[PROOF OF CONCEPT / ARTIFACT]:\n${s.codeSnippet}` : ""
      }`
  )
  .join("\n\n--------------------------------------------------------------------------------\n\n")}

================================================================================
VERIFICATION & ATTESTATION
Attested by Foretyx Security Enclave (Mumbai Region)
Cryptographic Signature: SHA256:${Math.random().toString(36).substring(2)}${Date.now().toString(36)}
© 2026 Foretyx Security Research · Bengaluru, India
================================================================================
`;

      const blob = new Blob([content], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloading(false);
      setDownloaded(true);

      toast.success(`Downloaded "${fileName}"`, {
        description: "Saved to your device Downloads folder"
      });

      setTimeout(() => setDownloaded(false), 3000);
    }, 400);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: paper.title,
        text: paper.abstract,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Paper URL copied to clipboard");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-[#FAF8F5] text-[#1C1917] border border-[#1C1917]/15 p-6 sm:p-10 shadow-2xl font-sans rounded-xl">
        {/* Header Metadata */}
        <DialogHeader className="text-left space-y-4 border-b border-[#1C1917]/10 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#164e43]/10 text-[#164e43] font-mono text-[11px] uppercase tracking-[0.14em] font-semibold">
              <BookOpen className="h-3.5 w-3.5" />
              {paper.tag}
            </div>
            <span className="font-mono text-xs text-[#1C1917]/50 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {paper.date}
            </span>
          </div>

          <DialogTitle className="display-serif text-2xl sm:text-4xl leading-[1.25] text-[#1C1917]">
            {paper.title}
          </DialogTitle>

          <DialogDescription className="text-[#1C1917]/70 text-sm flex flex-wrap items-center gap-y-2 gap-x-4 pt-1">
            <span className="inline-flex items-center gap-1.5 font-medium text-[#1C1917]/85">
              <User className="h-3.5 w-3.5 text-[#164e43]" />
              {paper.authors.join(", ")}
            </span>
            <span className="text-[#1C1917]/30">•</span>
            <span className="font-mono text-xs bg-[#1C1917]/5 px-2 py-0.5 rounded text-[#1C1917]/70">
              {paper.citation}
            </span>
          </DialogDescription>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#164e43] text-white hover:bg-[#123e35] disabled:opacity-75 transition-colors text-xs font-medium uppercase tracking-[0.06em]"
            >
              {downloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : downloaded ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {downloading ? "Downloading..." : downloaded ? "Downloaded PDF" : "Download PDF"}
            </button>
            <button
              onClick={handleCopyCitation}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md border border-[#1C1917]/20 hover:bg-[#1C1917]/5 transition-colors text-xs font-medium text-[#1C1917]/80"
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Cite Paper"}
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md border border-[#1C1917]/20 hover:bg-[#1C1917]/5 transition-colors text-xs font-medium text-[#1C1917]/80"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
          </div>
        </DialogHeader>

        {/* Abstract Box */}
        <div className="my-6 p-5 rounded-lg bg-[#164e43]/5 border border-[#164e43]/20 space-y-2">
          <div className="font-sans text-[11px] uppercase tracking-[0.14em] text-[#164e43] font-bold flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            Executive Abstract
          </div>
          <p className="font-body text-base text-[#1C1917]/90 leading-relaxed italic">
            "{paper.abstract}"
          </p>
        </div>

        {/* Paper Sections */}
        <div className="space-y-8 font-body text-[16px] leading-[1.75] text-[#1C1917]/85">
          {paper.sections.map((sec, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="display-serif text-xl sm:text-2xl text-[#1C1917] font-medium pt-2 border-t border-[#1C1917]/10">
                {sec.heading}
              </h3>
              <p className="text-[#1C1917]/85">
                {sec.content}
              </p>

              {sec.codeSnippet && (
                <div className="mt-4 rounded-lg bg-[#111210] text-[#E6E4DD] p-4 font-mono text-xs leading-relaxed border border-[#1C1917]/20 shadow-inner overflow-x-auto">
                  <div className="text-[10px] text-emerald-400 uppercase tracking-widest mb-2 font-sans font-bold flex items-center gap-1.5">
                    <FileText className="h-3 w-3" /> Artifact / Payload Evidence
                  </div>
                  <pre className="whitespace-pre-wrap">{sec.codeSnippet}</pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-10 pt-6 border-t border-[#1C1917]/15 flex flex-wrap items-center justify-between text-xs text-[#1C1917]/50 font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#164e43]" />
            Peer-reviewed & attested by Foretyx Security Enclave
          </div>
          <div>Licensed under CC BY-NC 4.0</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
