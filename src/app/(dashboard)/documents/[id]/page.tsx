'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  FileText,
  MagicWand,
  CheckCircle,
  Clock,
  WarningCircle,
  CircleNotch,
  DownloadSimple,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import { formatDate } from '@/lib/utils/format';

const statusConfig: Record<string, { icon: any; label: string; className: string }> = {
  pending: { icon: Clock, label: 'Pending', className: 'bg-gray-100 text-gray-800' },
  processing: { icon: CircleNotch, label: 'Processing', className: 'bg-blue-100 text-blue-800' },
  completed: { icon: CheckCircle, label: 'Extracted', className: 'bg-green-100 text-green-800' },
  failed: { icon: WarningCircle, label: 'Failed', className: 'bg-red-100 text-red-800' },
  needs_review: { icon: WarningCircle, label: 'Needs Review', className: 'bg-yellow-100 text-yellow-800' },
};

export default function DocumentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  async function fetchDocument() {
    try {
      const res = await fetch(`/api/documents/${id}`);
      if (res.ok) {
        const { data } = await res.json();
        setDocument(data);
      } else {
        setDocument(null);
      }
    } catch {
      setDocument(null);
    } finally {
      setLoading(false);
    }
  }

  async function triggerExtraction() {
    setExtracting(true);
    try {
      const res = await fetch(`/api/documents/${id}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentContent: 'Document content would be extracted from storage',
          documentType: document?.type,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDocument((prev: any) => ({
          ...prev,
          extraction_status: 'completed',
          extracted_data: data.extraction,
          confidence_scores: { overall: data.extraction?.overallConfidence || 0.95 },
        }));
      }
    } catch (error) {
      console.error('Extraction failed:', error);
    } finally {
      setExtracting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <CircleNotch className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <p>Document not found</p>
        <Button asChild className="mt-4">
          <Link href="/documents">Back to Documents</Link>
        </Button>
      </div>
    );
  }

  const status = statusConfig[document.extraction_status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const extraction = document.extracted_data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/documents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-normal tracking-tight">{document.name}</h1>
          <p className="text-muted-foreground">
            {document.loans?.borrowers?.name} - {document.loans?.name}
          </p>
        </div>
        {document.extraction_status === 'pending' && (
          <Button onClick={triggerExtraction} disabled={extracting}>
            {extracting ? (
              <CircleNotch className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <MagicWand className="h-4 w-4 mr-2" />
            )}
            {extracting ? 'Extracting...' : 'Extract with AI'}
          </Button>
        )}
        {document.extraction_status === 'completed' && (
          <Button variant="outline" onClick={triggerExtraction} disabled={extracting}>
            <ArrowsClockwise className={`h-4 w-4 mr-2 ${extracting ? 'animate-spin' : ''}`} />
            Re-extract
          </Button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-base">
              {document.type?.replace('_', ' ')}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={status.className}>
              <StatusIcon className={`h-3 w-3 mr-1 ${document.extraction_status === 'processing' ? 'animate-spin' : ''}`} />
              {status.label}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {document.confidence_scores?.overall
                ? `${(document.confidence_scores.overall * 100).toFixed(0)}%`
                : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Uploaded</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formatDate(document.created_at)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Extraction Results */}
      {extraction && (
        <Tabs defaultValue="covenants" className="space-y-4">
          <TabsList>
            <TabsTrigger value="covenants">Covenants ({extraction.covenants?.length || 0})</TabsTrigger>
            <TabsTrigger value="ebitda">EBITDA Definition</TabsTrigger>
            <TabsTrigger value="financials">Financial Data</TabsTrigger>
            <TabsTrigger value="raw">Raw JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="covenants">
            <Card>
              <CardHeader>
                <CardTitle>Extracted Covenants</CardTitle>
              </CardHeader>
              <CardContent>
                {extraction.covenants && extraction.covenants.length > 0 ? (
                  <div className="space-y-4">
                    {extraction.covenants.map((covenant: any, index: number) => (
                      <div key={index} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{covenant.name}</h4>
                          <Badge variant="outline">
                            {(covenant.confidence * 100).toFixed(0)}% confidence
                          </Badge>
                        </div>
                        <div className="grid gap-2 text-sm">
                          <div className="flex gap-4">
                            <span className="text-muted-foreground">Type:</span>
                            <span>{covenant.type}</span>
                          </div>
                          <div className="flex gap-4">
                            <span className="text-muted-foreground">Threshold:</span>
                            <span>
                              {covenant.operator === 'max' ? '≤' : '≥'} {covenant.threshold}x
                            </span>
                          </div>
                          <div className="flex gap-4">
                            <span className="text-muted-foreground">Frequency:</span>
                            <span>{covenant.testingFrequency}</span>
                          </div>
                          {covenant.sourceClause && (
                            <div className="mt-2 p-3 bg-muted rounded text-xs">
                              <p className="text-muted-foreground mb-1">Source Clause:</p>
                              {covenant.sourceClause}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No covenants extracted</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ebitda">
            <Card>
              <CardHeader>
                <CardTitle>EBITDA Definition</CardTitle>
              </CardHeader>
              <CardContent>
                {extraction.ebitdaDefinition ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm">{extraction.ebitdaDefinition}</p>
                    </div>
                    {extraction.ebitdaAddbacks && extraction.ebitdaAddbacks.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Permitted Add-backs</h4>
                        <ul className="space-y-2">
                          {extraction.ebitdaAddbacks.map((addback: any, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <Badge variant="outline" className="mt-0.5">{addback.category}</Badge>
                              <div>
                                <p>{addback.description}</p>
                                {addback.cap && (
                                  <p className="text-muted-foreground">Cap: {addback.cap}</p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No EBITDA definition extracted</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financials">
            <Card>
              <CardHeader>
                <CardTitle>Financial Data</CardTitle>
              </CardHeader>
              <CardContent>
                {extraction.financialData && extraction.financialData.length > 0 ? (
                  <div className="space-y-4">
                    {extraction.financialData.map((period: any, index: number) => (
                      <div key={index} className="rounded-lg border p-4">
                        <h4 className="font-semibold mb-2">
                          Period Ending: {period.periodEndDate}
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {period.revenue && (
                            <div>
                              <span className="text-muted-foreground">Revenue:</span>{' '}
                              ${(period.revenue / 1000000).toFixed(1)}M
                            </div>
                          )}
                          {period.ebitdaReported && (
                            <div>
                              <span className="text-muted-foreground">EBITDA:</span>{' '}
                              ${(period.ebitdaReported / 1000000).toFixed(1)}M
                            </div>
                          )}
                          {period.totalDebt && (
                            <div>
                              <span className="text-muted-foreground">Total Debt:</span>{' '}
                              ${(period.totalDebt / 1000000).toFixed(1)}M
                            </div>
                          )}
                          {period.interestExpense && (
                            <div>
                              <span className="text-muted-foreground">Interest:</span>{' '}
                              ${(period.interestExpense / 1000000).toFixed(1)}M
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No financial data extracted</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="raw">
            <Card>
              <CardHeader>
                <CardTitle>Raw Extraction Data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-muted rounded-lg overflow-auto text-xs max-h-96">
                  {JSON.stringify(extraction, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
