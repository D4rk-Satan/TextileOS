import React, { Suspense } from 'react';
import { getGreyInwards } from '@/app/actions/warehouse';
import { GreyList } from '@/components/warehouse/GreyList';
import { TableSkeleton } from '@/components/shared/Skeleton';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function GreyPageContent({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const query = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  
  const result = await getGreyInwards(query, {}, page, 20);
  
  const data = result?.success ? result.data : [];
  const totalCount = result?.success ? result.totalCount : 0;

  return (
    <GreyList 
      initialData={data as any} 
      totalCount={totalCount || 0} 
    />
  );
}

export default async function GreyPage(props: PageProps) {
  const searchParams = await props.searchParams;
  
  return (
    <Suspense fallback={<TableSkeleton />}>
      <GreyPageContent searchParams={searchParams} />
    </Suspense>
  );
}
