import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UploadSimple, FileText, Eye, CheckCircle, Clock, WarningCircle, CircleNotch } from '@phosphor-icons/react/dist/ssr';
import { formatDate } from '@/lib/utils/format';

const statusConfig: Record<string, { icon: any; label: string; className: string }> = {
  pending: { icon: Clock, label: 'Pending', className: 'bg-gray-100 text-gray-800' },
  processing: { icon: CircleNotch, label: 'Processing', className: 'bg-blue-100 text-blue-800' },
  completed: { icon: CheckCircle, label: 'Extracted', className: 'bg-green-100 text-green-800' },
  failed: { icon: WarningCircle, label: 'Failed', className: 'bg-red-100 text-red-800' },
  needs_review: { icon: WarningCircle, label: 'Needs Review', className: 'bg-yellow-100 text-yellow-800' },
};

export default async function DocumentsPage() {
  const { userId } = await auth();

  // For demo, use mock data if no auth
  if (!userId) {
    return <DocumentsPageContent documents={mockDocuments} />;
  }

  const supabase = await createClient();

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('clerk_id', userId)
    .single();

  const orgId = (userData as { organization_id: string } | null)?.organization_id;

  if (!orgId) {
    return <DocumentsPageContent documents={mockDocuments} />;
  }

  const { data: documents } = await supabase
    .from('documents')
    .select(`
      *,
      loans (id, name, borrowers (name))
    `)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return <DocumentsPageContent documents={documents || mockDocuments} />;
}

function DocumentsPageContent({ documents }: { documents: any[] }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Upload and extract data from loan documents
          </p>
        </div>
        <Button asChild>
          <Link href="/documents/upload">
            <UploadSimple className="h-4 w-4 mr-2" />
            Upload Document
          </Link>
        </Button>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No documents uploaded yet</p>
              <Button asChild className="mt-4">
                <Link href="/documents/upload">Upload your first document</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Loan</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc: any) => {
                  const status = statusConfig[doc.extraction_status] || statusConfig.pending;
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-red-500" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/loans/${doc.loan_id}`} className="text-blue-600 hover:underline">
                          {doc.loans?.borrowers?.name || 'Unknown'}
                        </Link>
                        <p className="text-sm text-muted-foreground">{doc.loans?.name}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.type?.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.className}>
                          <StatusIcon className={`h-3 w-3 mr-1 ${doc.extraction_status === 'processing' ? 'animate-spin' : ''}`} />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(doc.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/documents/${doc.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const mockDocuments = [
  {
    id: '1',
    name: 'Acme Corp Credit Agreement.pdf',
    loan_id: '1',
    type: 'credit_agreement',
    extraction_status: 'completed',
    file_size: 2500000,
    created_at: '2025-12-15T10:00:00Z',
    loans: { id: '1', name: 'Senior Term Loan', borrowers: { name: 'Acme Corporation' } },
  },
  {
    id: '2',
    name: 'Q4 2025 Compliance Certificate.pdf',
    loan_id: '1',
    type: 'compliance_certificate',
    extraction_status: 'completed',
    file_size: 850000,
    created_at: '2026-01-05T14:30:00Z',
    loans: { id: '1', name: 'Senior Term Loan', borrowers: { name: 'Acme Corporation' } },
  },
  {
    id: '3',
    name: 'Beta Industries Term Loan Agreement.pdf',
    loan_id: '2',
    type: 'credit_agreement',
    extraction_status: 'pending',
    file_size: 3200000,
    created_at: '2026-01-06T09:15:00Z',
    loans: { id: '2', name: 'Term Loan B', borrowers: { name: 'Beta Industries' } },
  },
];
