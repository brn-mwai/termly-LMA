import { DocumentUploader } from "@/components/upload/document-uploader";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Documents</h1>
        <p className="text-muted-foreground">
          Upload credit agreements, compliance certificates, and financial
          statements for AI-powered extraction
        </p>
      </div>
      <DocumentUploader />
    </div>
  );
}
