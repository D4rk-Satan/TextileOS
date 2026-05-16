import React, { Suspense } from 'react';
import { getOutForPrintingLots, getPrintingReceives } from '@/app/actions/printing';
import { PrintingList } from '@/components/printing/PrintingList';
import { TableSkeleton } from '@/components/shared/Skeleton';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function PrintingPageContent({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const query = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const tab = (typeof searchParams.tab === 'string' ? searchParams.tab : 'issue') as 'issue' | 'receive';
  
  let result;
  if (tab === 'issue') {
    result = await getOutForPrintingLots(query, {}, page, 20);
  } else {
    result = await getPrintingReceives(query, {}, page, 20);
  }
  
  const data = result?.success ? result.data : [];
  const totalCount = result?.success ? result.totalCount : 0;
  const totalPages = result?.success ? result.totalPages : 1;

  return (
    <PrintingList 
      initialData={data as any} 
      totalCount={totalCount || 0} 
      totalPages={totalPages || 1}
      currentPage={page}
      activeTab={tab}
    />
  );
}

export default async function PrintingProcessPage(props: PageProps) {
  const searchParams = await props.searchParams;
  
  return (
    <Suspense fallback={<TableSkeleton />}>
      <PrintingPageContent searchParams={searchParams} />
    </Suspense>
  );
}
