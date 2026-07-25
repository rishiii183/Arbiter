import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, BookOpen, Download, ArrowRight, ShieldCheck, Filter, FileText, ExternalLink } from "lucide-react";
import { useState } from "react";
import { ResearchPaper } from "./PaperReaderDialog";
import { toast } from "sonner";

interface AllPapersDialogProps {
  papers: ResearchPaper[];
  isOpen: boolean;
  onClose: () => void;
  onSelectPaper: (paper: ResearchPaper) => void;
}

export function AllPapersDialog({ papers, isOpen, onClose, onSelectPaper }: AllPapersDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string>("All");

  const tags = ["All", ...Array.from(new Set(papers.map((p) => p.tag)))];

  const filteredPapers = papers.filter((p) => {
    const matchesTag = activeTag === "All" || p.tag === activeTag;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.authors.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTag && matchesSearch;
  });

  const handleDownloadDirect = (e: React.MouseEvent, paper: ResearchPaper) => {
    e.stopPropagation();
    const fileName = `${paper.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
    const content = `FORETYX RESEARCH ARCHIVE · ${paper.title.toUpperCase()}\n${paper.citation}\nDate: ${paper.date}\nAuthors: ${paper.authors.join(", ")}\n\nABSTRACT:\n${paper.abstract}\n\nSECTIONS:\n${paper.sections.map(s => `${s.heading}\n${s.content}`).join("\n\n")}`;
    const blob = new Blob([content], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded "${fileName}"`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto bg-[#FAF8F5] text-[#1C1917] border border-[#1C1917]/15 p-6 sm:p-10 shadow-2xl font-sans rounded-xl">
        <DialogHeader className="text-left space-y-3 border-b border-[#1C1917]/10 pb-6">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.14em] text-[#164e43] font-bold">
            <BookOpen className="h-4 w-4" />
            Foretyx Security Research Library
          </div>
          <DialogTitle className="display-serif text-3xl sm:text-4xl text-[#1C1917]">
            All Research Publications & Papers
          </DialogTitle>
          <DialogDescription className="text-[#1C1917]/75 text-sm">
            Browse our complete catalog of peer-reviewed threat models, CVE advisories, red-teaming methodologies, and compliance benchmark papers.
          </DialogDescription>

          {/* Search & Tag Filter Bar */}
          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1C1917]/40" />
              <input
                type="text"
                placeholder="Search papers by keyword, CVE, author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#1C1917]/20 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#164e43]/30 text-[#1C1917]"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeTag === tag
                      ? "bg-[#164e43] text-white"
                      : "bg-[#1C1917]/5 text-[#1C1917]/70 hover:bg-[#1C1917]/10"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Catalog Grid */}
        <div className="py-6 space-y-4">
          <div className="text-xs font-mono text-[#1C1917]/50 flex items-center justify-between">
            <span>Showing {filteredPapers.length} of {papers.length} publications</span>
            <span>Independent & Open Access</span>
          </div>

          {filteredPapers.length === 0 ? (
            <div className="py-12 text-center text-[#1C1917]/50 font-body">
              No research papers found matching "{searchQuery}".
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredPapers.map((paper) => (
                <div
                  key={paper.id}
                  onClick={() => {
                    onClose();
                    onSelectPaper(paper);
                  }}
                  className="group bg-white p-6 rounded-xl border border-[#1C1917]/12 hover:border-[#164e43]/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#164e43]/10 text-[#164e43] text-[10px] uppercase font-mono tracking-wider font-bold">
                        {paper.tag}
                      </span>
                      <span className="font-mono text-[11px] text-[#1C1917]/40">{paper.date}</span>
                    </div>

                    <h4 className="display-serif text-xl text-[#1C1917] group-hover:text-[#164e43] transition-colors leading-snug">
                      {paper.title}
                    </h4>

                    <p className="mt-3 font-body text-xs leading-relaxed text-[#1C1917]/75 line-clamp-3">
                      {paper.abstract}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#1C1917]/10 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#164e43] group-hover:underline">
                      Read full paper <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                    <button
                      onClick={(e) => handleDownloadDirect(e, paper)}
                      title="Download PDF"
                      className="p-1.5 rounded hover:bg-[#1C1917]/5 text-[#1C1917]/60 hover:text-[#1C1917] transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-[#1C1917]/10 flex items-center justify-between text-xs text-[#1C1917]/50 font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#164e43]" />
            Foretyx Security Research Archive · 2026
          </div>
          <div>CC BY-NC 4.0</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
