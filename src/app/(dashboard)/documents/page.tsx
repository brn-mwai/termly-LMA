import { Suspense } from 'react';
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
import { DocumentsTableSkeleton } from '@/components/documents/documents-table-skeleton';

const statusConfig: Record<string, { icon: any; label: string; className: string }> = {
  pending: { icon: Clock, label: 'Pending', className: 'bg-gray-100 text-gray-800' },
  processing: { icon: CircleNotch, label: 'Processing', className: 'bg-blue-100 text-blue-800' },
  completed: { icon: CheckCircle, label: 'Extracted', className: 'bg-green-100 text-green-800' },
  failed: { icon: WarningCircle, label: 'Failed', className: 'bg-red-100 text-red-800' },
  needs_review: { icon: WarningCircle, label: 'Needs Review', className: 'bg-yellow-100 text-yellow-800' },
};

async function getDocuments() {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = await createClient();

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('clerk_id', userId)
    .single();

  const orgId = (userData as { organization_id: string } | null)?.organization_id;
  if (!orgId) return [];

  const { data } = await supabase
    .from('documents')
    .select(`
      *,
      loans (id, name, borrowers (name))
    `)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return data || [];
}

async function DocumentsTable() {
  const documents = await getDocuments();

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Documents (0)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No documents uploaded yet</p>
            <Button asChild className="mt-4">
              <Link href="/documents/upload">Upload your first document</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          All Documents ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Document</TableHead>
                <TableHead className="hidden md:table-cell">Loan</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Uploaded</TableHead>
                <TableHead className="text-right w-[60px]">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc: any) => {
                const status = statusConfig[doc.extraction_status] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <TableRow key={doc.id}>
                    <TableCell className="max-w-[200px]">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate" title={doc.name}>{doc.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[150px]">
                      <Link href={`/loans/${doc.loan_id}`} className="text-blue-600 hover:underline truncate block" title={doc.loans?.borrowers?.name || 'Unknown'}>
                        {doc.loans?.borrowers?.name || 'Unknown'}
                      </Link>
                      <p className="text-sm text-muted-foreground truncate" title={doc.loans?.name}>{doc.loans?.name}</p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{doc.type?.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={status.className}>
                        <StatusIcon className={`h-3 w-3 mr-1 ${doc.extraction_status === 'processing' ? 'animate-spin' : ''}`} />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap hidden lg:table-cell">
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
        </div>
      </CardContent>
    </Card>
  );
}

export default function DocumentsPage() {
  return (
    <div className="space-y-4 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-normal tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Upload and extract data from loan documents
          </p>
        </div>
        <Button asChild className="w-fit">
          <Link href="/documents/upload">
            <UploadSimple className="h-4 w-4 mr-2" />
            Upload
          </Link>
        </Button>
      </div>

      {/* Documents Table with Suspense */}
      <div className="min-w-0 overflow-hidden">
        <Suspense fallback={<DocumentsTableSkeleton />}>
          <DocumentsTable />
        </Suspense>
      </div>
    </div>
  );
}
