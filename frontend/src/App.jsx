import { useEffect, useMemo, useRef, useState } from "react";

const CONVERSION_OPTIONS = [
  {
    value: "pdf_to_word",
    label: "PDF to DOC",
    accept: ".pdf,application/pdf",
    helper: "Upload a PDF file and receive a DOCX document.",
  },
  {
    value: "word_to_pdf",
    label: "DOC to PDF",
    accept:
      ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    helper: "Upload a DOCX file and receive a PDF document.",
  },
];

const STATUS_LABELS = {
  pending: "Queued",
  processing: "Converting",
  completed: "Ready",
  failed: "Failed",
};

function App() {
  const [selectedType, setSelectedType] = useState(CONVERSION_OPTIONS[0].value);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [conversion, setConversion] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const pulseIntervalRef = useRef(null);

  const selectedOption = useMemo(
    () => CONVERSION_OPTIONS.find((option) => option.value === selectedType),
    [selectedType],
  );

  useEffect(() => {
    return () => {
      window.clearInterval(pulseIntervalRef.current);
    };
  }, []);

  const resetFlow = () => {
    window.clearInterval(pulseIntervalRef.current);
    pulseIntervalRef.current = null;
    setProgress(0);
    setUploading(false);
    setConversion(null);
    setErrorMessage("");
  };

  const handleTypeChange = (event) => {
    setSelectedType(event.target.value);
    setSelectedFile(null);
    resetFlow();
  };

  const isAcceptedFile = (file) => {
    if (!file) {
      return false;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (selectedType === "pdf_to_word") {
      return extension === "pdf";
    }

    return extension === "docx";
  };

  const handleFileSelection = (file) => {
    if (!file) {
      return;
    }

    if (!isAcceptedFile(file)) {
      setSelectedFile(null);
      setConversion(null);
      setProgress(0);
      setErrorMessage(
        selectedType === "pdf_to_word"
          ? "Choose a PDF file for PDF to DOC conversion."
          : "Choose a DOCX file for DOC to PDF conversion.",
      );
      return;
    }

    setSelectedFile(file);
    setConversion(null);
    setProgress(0);
    setErrorMessage("");
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    handleFileSelection(event.dataTransfer.files?.[0] ?? null);
  };

  const startProgressPulse = () => {
    window.clearInterval(pulseIntervalRef.current);
    pulseIntervalRef.current = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 92) {
          return current;
        }

        return current + 1;
      });
    }, 180);
  };

  const fetchConversion = async (conversionId) => {
    const response = await fetch(`/api/conversions/${conversionId}/`);

    if (!response.ok) {
      throw new Error("Unable to fetch conversion status.");
    }

    return response.json();
  };

  const handleConvert = async () => {
    if (!selectedFile || uploading) {
      return;
    }

    setUploading(true);
    setConversion(null);
    setErrorMessage("");
    setProgress(3);

    const formData = new FormData();
    formData.append("conversion_type", selectedType);
    formData.append("original_file", selectedFile);

    try {
      const createdConversion = await new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("POST", "/api/conversions/");

        request.upload.onprogress = (event) => {
          if (!event.lengthComputable) {
            return;
          }

          const uploadPercent = Math.round((event.loaded / event.total) * 65);
          setProgress(Math.max(8, uploadPercent));
        };

        request.onload = () => {
          if (request.status >= 200 && request.status < 300) {
            resolve(JSON.parse(request.responseText));
            return;
          }

          let message = "Conversion failed.";

          try {
            const payload = JSON.parse(request.responseText);
            if (payload?.original_file?.[0]) {
              message = payload.original_file[0];
            } else if (payload?.error_message) {
              message = payload.error_message;
            }
          } catch {
            // Keep default message when the response body is not JSON.
          }

          reject(new Error(message));
        };

        request.onerror = () => reject(new Error("Unable to reach the backend."));
        request.send(formData);
      });

      startProgressPulse();

      const latestConversion = await fetchConversion(createdConversion.id);
      window.clearInterval(pulseIntervalRef.current);
      pulseIntervalRef.current = null;

      setConversion(latestConversion);
      setProgress(latestConversion.status === "completed" ? 100 : 0);

      if (latestConversion.status === "failed") {
        setErrorMessage(
          latestConversion.error_message || "Conversion failed on the server.",
        );
      }
    } catch (error) {
      window.clearInterval(pulseIntervalRef.current);
      pulseIntervalRef.current = null;
      setConversion(null);
      setProgress(0);
      setErrorMessage(error.message || "Conversion failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = () => {
    if (!conversion?.converted_file_url) {
      return;
    }

    window.open(conversion.converted_file_url, "_blank", "noopener,noreferrer");
  };

  const currentStatus = conversion?.status
    ? STATUS_LABELS[conversion.status]
    : uploading
      ? "Uploading"
      : selectedFile
        ? "Ready to convert"
        : "Waiting for file";

  return (
    <div className="min-h-screen bg-transparent text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between rounded-full border border-white/60 bg-white/70 px-5 py-4 shadow-panel backdrop-blur">
          <div>
            <p className="font-display text-2xl font-extrabold tracking-tight text-ink">
              DalBadlu
            </p>
            <p className="text-sm text-slate-500">Document conversion workspace</p>
          </div>
          <div className="hidden rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 md:block">
            PDF <span className="mx-2 text-slate-300">|</span> DOCX
          </div>
        </header>

        <main className="flex flex-1 items-center">
          <section className="glass-panel grid w-full gap-8 overflow-hidden rounded-[2rem] border border-white/70 p-6 shadow-panel lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div className="relative overflow-hidden rounded-[1.75rem] bg-ink px-6 py-8 text-white lg:px-8 lg:py-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,122,24,0.36),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.22),_transparent_24%)]" />
              <div className="relative">
                <p className="mb-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.28em] text-orange-200">
                  Smart converter
                </p>
                <h1 className="max-w-xl font-display text-4xl font-extrabold leading-tight sm:text-5xl">
                  Shift documents between PDF and DOC without leaving the page.
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
                  Choose the conversion type, drop a file into the panel, and the
                  app will surface the converted result as soon as the backend
                  finishes processing it.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-300">
                      Supported input
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                      {selectedType === "pdf_to_word" ? "PDF" : "DOCX"}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-300">
                      Current state
                    </p>
                    <p className="mt-2 text-2xl font-bold">{currentStatus}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-6 shadow-sm">
                <label
                  htmlFor="conversionType"
                  className="mb-3 block text-sm font-bold uppercase tracking-[0.18em] text-slate-500"
                >
                  Conversion Type
                </label>
                <div className="relative">
                  <select
                    id="conversionType"
                    value={selectedType}
                    onChange={handleTypeChange}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 pr-12 text-base font-semibold text-slate-700 outline-none transition focus:border-accent focus:bg-white"
                  >
                    {CONVERSION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                    ▾
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {selectedOption.helper}
                </p>

                {!selectedFile && !uploading && !conversion ? (
                  <label
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    className={`mt-6 flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed px-6 py-8 text-center transition ${
                      dragActive
                        ? "border-accent bg-orange-50"
                        : "border-slate-200 bg-[linear-gradient(180deg,#fff_0%,#f8fafc_100%)]"
                    }`}
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-2xl text-white shadow-lg shadow-slate-300/40">
                      ↑
                    </div>
                    <p className="mt-5 text-lg font-extrabold text-slate-700">
                      Drop your file here
                    </p>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      Or click to browse. The uploader validates the file extension
                      against the selected conversion type.
                    </p>
                    <span className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                      Select file
                    </span>
                    <input
                      type="file"
                      accept={selectedOption.accept}
                      className="hidden"
                      onChange={(event) =>
                        handleFileSelection(event.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                ) : (
                  <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                          Selected file
                        </p>
                        <p className="mt-2 break-all text-lg font-bold text-slate-800">
                          {selectedFile?.name ?? "Latest conversion"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {conversion?.status
                            ? `Status: ${STATUS_LABELS[conversion.status]}`
                            : "File loaded and ready for conversion."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          resetFlow();
                        }}
                        className="rounded-full border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                      >
                        Reset
                      </button>
                    </div>

                    <div className="mt-6">
                      <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-600">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#ff7a18_0%,#ffb347_48%,#0f766e_100%)] transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {errorMessage ? (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {errorMessage}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={
                    conversion?.status === "completed" ? handleDownload : handleConvert
                  }
                  disabled={
                    uploading ||
                    (!selectedFile && conversion?.status !== "completed")
                  }
                  className="mt-6 w-full rounded-2xl bg-ink px-5 py-4 text-base font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {conversion?.status === "completed"
                    ? "Download"
                    : uploading
                      ? "Converting..."
                      : "Convert"}
                </button>
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-8 rounded-[1.75rem] border border-white/70 bg-white/75 px-6 py-5 shadow-panel backdrop-blur">
          <div className="flex flex-col gap-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-display text-lg font-bold text-slate-800">
                DalBadlu
              </p>
              <p className="mt-1">
                Frontend built with React and Tailwind CSS, connected to the
                existing Django conversion API.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-2">React</span>
              <span className="rounded-full bg-slate-100 px-3 py-2">
                Tailwind CSS
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-2">Django API</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
