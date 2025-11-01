import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner@2.0.3";
import { api, Essay } from "../services/api";

export function DocumentWorkspace() {
  const [documents, setDocuments] = useState<Essay[]>([]);
  const [activeDoc, setActiveDoc] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingContent, setGeneratingContent] = useState("");
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [editingDocName, setEditingDocName] = useState<string | null>(null);
  const [newDocName, setNewDocName] = useState("");
  const [generateParams, setGenerateParams] = useState({
    university: "",
    major: "",
    wordLimit: 500,
    useNarrative: true,
    useIdeas: true,
    useConversations: true,
  });

  const currentDoc = documents.find((doc) => doc.id === activeDoc);

  // Load existing essays
  useEffect(() => {
    loadEssays();
  }, []);

  const loadEssays = async () => {
    try {
      const essays = await api.listEssays();
      setDocuments(essays);
      if (essays.length > 0 && !activeDoc) {
        setActiveDoc(essays[0].id);
      }
    } catch (err) {
      console.error("Failed to load essays:", err);
      // Use mock data if API fails
      setDocuments([
        {
          id: "1",
          university: "Stanford",
          version: 1,
          content: `As someone deeply passionate about the intersection of artificial intelligence and education, I have always believed that technology can bridge the gap in educational resources.

During my sophomore year, I volunteered to teach in a remote mountain village in Guizhou. The experience was transformative. I witnessed firsthand how brilliant young minds were constrained by lack of access to quality learning materials. This sparked a question that would define my path: How could I use my computer science knowledge to create meaningful change?

Upon returning to campus, I began developing an AI-powered learning assistant. From user research to algorithm design, each step presented unique challenges. The most memorable moment came when I received feedback from a student in the mountains. He said the tool made him "feel that learning could be fun for the first time." In that moment, I understood the true warmth of technology.

This experience not only honed my technical abilities but, more importantly, clarified my future direction. At Stanford, I hope to continue this journey, deeply integrating AI with education to develop intelligent tools that can truly benefit more students.`,
          status: "draft",
          wordCount: 287,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          university: "MIT",
          version: 1,
          content: `Technology and education have been my twin passions. Growing up where educational resources were scarce, I witnessed how technology could bridge privilege and opportunity.

During my sophomore year, I volunteered in a remote village. The experience was transformative—brilliant minds constrained by lack of access to quality materials.

Back on campus, I developed an AI learning assistant. The technical challenges were significant, but understanding what students truly needed was harder.

At MIT, I hope to deepen my understanding of AI and education technology, creating scalable solutions with leading researchers.`,
          status: "draft",
          wordCount: 215,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
      setActiveDoc("1");
    }
  };

  const handleGenerate = async () => {
    if (!generateParams.university.trim()) {
      toast.error("Please enter university name");
      return;
    }
    if (!generateParams.major.trim()) {
      toast.error("Please enter target major");
      return;
    }

    setIsGenerating(true);
    setGeneratingContent("");
    setShowGenerateDialog(false);

    try {
      await api.streamEssay(generateParams, (chunk) => {
        setGeneratingContent((prev) => prev + chunk);
      });

      // Save the generated essay
      const newEssay: Essay = {
        id: Date.now().toString(),
        university: generateParams.university,
        version: 1,
        content: generatingContent,
        status: "draft",
        wordCount: generatingContent.split(/\s+/).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await api.saveEssay(newEssay);
      setDocuments((prev) => [...prev, newEssay]);
      setActiveDoc(newEssay.id);
      setGeneratingContent("");
      toast.success("Essay generated successfully!");
    } catch (err) {
      console.error("Failed to generate essay:", err);
      toast.error("Failed to generate essay. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateContent = async (content: string) => {
    if (!currentDoc) return;

    const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;
    const updated = {
      ...currentDoc,
      content,
      wordCount,
      updatedAt: new Date().toISOString(),
    };

    setDocuments((prev) =>
      prev.map((doc) => (doc.id === currentDoc.id ? updated : doc))
    );

    // Auto-save
    try {
      await api.saveEssay(updated);
    } catch (err) {
      console.error("Failed to save essay:", err);
    }
  };

  const copyToClipboard = () => {
    if (currentDoc) {
      navigator.clipboard.writeText(currentDoc.content);
      toast.success("Copied to clipboard");
    }
  };

  const deleteEssay = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this essay?")) {
      try {
        // Delete from backend
        await api.deleteEssay(id);
      } catch (err) {
        console.error("Failed to delete essay from backend:", err);
        // Continue with frontend deletion even if backend fails
      }
      
      // Remove from frontend state
      const filtered = documents.filter((doc) => doc.id !== id);
      setDocuments(filtered);
      if (activeDoc === id && filtered.length > 0) {
        setActiveDoc(filtered[0].id);
      } else if (filtered.length === 0) {
        setActiveDoc("");
      }
      toast.success("Essay deleted successfully");
    }
  };

  const startRename = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDocName(id);
    setNewDocName(currentName);
  };

  const finishRename = () => {
    if (editingDocName && newDocName.trim()) {
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === editingDocName
            ? { ...doc, university: newDocName.trim() }
            : doc
        )
      );
    }
    setEditingDocName(null);
    setNewDocName("");
  };

  return (
    <div className="h-full flex bg-background">
      <div className="flex-1 flex flex-col">
        <div className="h-24 border-b border-border flex items-center justify-between px-16">
          <div className="flex gap-12 items-center">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setActiveDoc(doc.id)}
                className={`text-sm uppercase tracking-wider transition-all duration-300 relative ${
                  activeDoc === doc.id
                    ? "text-foreground"
                    : "text-muted-light hover:text-muted"
                }`}
              >
                {doc.university}
                {doc.status === "reviewing" && (
                  <span className="ml-2 text-xs">●</span>
                )}
                {activeDoc === doc.id && (
                  <span className="absolute -bottom-1 left-0 right-0 h-px bg-foreground" />
                )}
              </button>
            ))}

            <button
              onClick={() => setShowManageDialog(true)}
              className="text-sm uppercase tracking-wider text-muted hover:text-foreground transition-colors duration-300"
            >
              Manage
            </button>

            <button
              onClick={() => setShowGenerateDialog(true)}
              disabled={isGenerating}
              className="text-sm uppercase tracking-wider text-muted hover:text-foreground transition-colors duration-300 disabled:opacity-30"
            >
              + New Essay
            </button>
          </div>

          {currentDoc && (
            <div className="flex items-center gap-8">
              <span className="text-xs uppercase tracking-wider text-muted-light">
                {currentDoc.wordCount} words
              </span>
              <button
                onClick={copyToClipboard}
                className="text-xs uppercase tracking-wider text-muted hover:text-foreground transition-colors duration-300"
              >
                Copy
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden relative">
          {isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center px-16 py-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-3xl space-y-8"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <motion.div
                        className="w-2 h-2 bg-foreground rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: 0,
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-foreground rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: 0.2,
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-foreground rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: 0.4,
                        }}
                      />
                    </div>
                    <p className="text-sm uppercase tracking-wider text-muted">
                      Multi-Agent System Generating...
                    </p>
                  </div>
                  <p className="text-xs text-muted-light">
                    Narrator Agent → Writer Agent → Audit Agent
                  </p>
                </div>

                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap leading-relaxed text-[15px] text-foreground">
                    {generatingContent}
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="inline-block w-2 h-4 bg-foreground ml-1"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          ) : currentDoc ? (
            <div className="h-full px-16 py-12">
              <Textarea
                value={currentDoc.content}
                onChange={(e) => handleUpdateContent(e.target.value)}
                className="w-full h-full text-[15px] leading-relaxed resize-none border-none focus:ring-0 bg-transparent p-0"
                placeholder="Your personal statement will appear here..."
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <p className="text-muted text-sm">No essay selected</p>
                <button
                  onClick={() => setShowGenerateDialog(true)}
                  className="text-xs uppercase tracking-wider px-8 py-3 border border-foreground hover:bg-foreground hover:text-background transition-all duration-300"
                >
                  Generate New Essay
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generate Dialog */}
      {showGenerateDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background border border-border p-12 max-w-lg w-full space-y-8"
          >
            <h3 className="text-2xl tracking-tight">Generate Essay</h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-light">
                  Target University
                </label>
                <input
                  type="text"
                  value={generateParams.university}
                  onChange={(e) =>
                    setGenerateParams({
                      ...generateParams,
                      university: e.target.value,
                    })
                  }
                  placeholder=""
                  className="w-full px-4 py-3 border border-border bg-transparent focus:border-foreground outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-light">
                  Target Major
                </label>
                <input
                  type="text"
                  value={generateParams.major}
                  onChange={(e) =>
                    setGenerateParams({
                      ...generateParams,
                      major: e.target.value,
                    })
                  }
                  placeholder=""
                  className="w-full px-4 py-3 border border-border bg-transparent focus:border-foreground outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-light">
                  Word Limit: {generateParams.wordLimit}
                </label>
                <input
                  type="range"
                  min="200"
                  max="1000"
                  step="50"
                  value={generateParams.wordLimit}
                  onChange={(e) =>
                    setGenerateParams({
                      ...generateParams,
                      wordLimit: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs uppercase tracking-wider text-muted-light">
                  Use Data From
                </label>
                <div className="space-y-2">
                  {[
                    { key: "useIdeas", label: "Ideas" },
                    { key: "useConversations", label: "Dialogue History" },
                    { key: "useNarrative", label: "Narrative Timeline" },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={
                          generateParams[
                            key as keyof typeof generateParams
                          ] as boolean
                        }
                        onChange={(e) =>
                          setGenerateParams({
                            ...generateParams,
                            [key]: e.target.checked,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-8 border-t border-border">
              <button
                onClick={() => setShowGenerateDialog(false)}
                className="text-sm uppercase tracking-wider text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                className="text-sm uppercase tracking-wider px-8 py-3 bg-foreground text-background hover:bg-muted transition-all duration-300"
              >
                Generate
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Manage Essays Dialog */}
      {showManageDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background border border-border p-12 max-w-2xl w-full space-y-8"
          >
            <h3 className="text-2xl tracking-tight">Manage Essays</h3>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {documents.length === 0 ? (
                <p className="text-sm text-muted text-center py-8">
                  No essays yet. Create your first essay!
                </p>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="border border-border p-6 hover:border-foreground transition-colors"
                  >
                    {editingDocName === doc.id ? (
                      <div className="flex items-center gap-4">
                        <input
                          type="text"
                          value={newDocName}
                          onChange={(e) => setNewDocName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") finishRename();
                            if (e.key === "Escape") {
                              setEditingDocName(null);
                              setNewDocName("");
                            }
                          }}
                          className="flex-1 text-base px-4 py-2 border border-border bg-transparent focus:border-foreground outline-none"
                          autoFocus
                        />
                        <button
                          onClick={finishRename}
                          className="text-sm uppercase tracking-wider px-6 py-2 bg-foreground text-background"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium mb-2">
                            {doc.university}
                          </h4>
                          <div className="flex gap-4 text-xs text-muted-light">
                            <span>{doc.wordCount} words</span>
                            <span>Version {doc.version}</span>
                            <span>{doc.status}</span>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startRename(doc.id, doc.university, e);
                            }}
                            className="text-sm uppercase tracking-wider px-4 py-2 border border-border hover:border-foreground transition-colors"
                          >
                            Rename
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEssay(doc.id, e);
                              if (documents.length === 1) {
                                setShowManageDialog(false);
                              }
                            }}
                            className="text-sm uppercase tracking-wider px-4 py-2 border border-border hover:border-foreground hover:bg-foreground hover:text-background transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-8 border-t border-border">
              <button
                onClick={() => setShowManageDialog(false)}
                className="text-sm uppercase tracking-wider px-8 py-3 bg-foreground text-background hover:bg-muted transition-all duration-300"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
