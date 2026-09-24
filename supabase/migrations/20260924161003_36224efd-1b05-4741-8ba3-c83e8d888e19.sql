DROP POLICY IF EXISTS op_docs_storage_insert ON storage.objects;
DROP POLICY IF EXISTS op_docs_storage_update ON storage.objects;
DROP POLICY IF EXISTS op_docs_storage_delete ON storage.objects;

CREATE POLICY op_docs_storage_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'operation-docs'
  AND owner_id = (select auth.uid()::text)
  AND (storage.foldername(name))[1] = (SELECT u.company_id::text FROM public.users u WHERE u.id = auth.uid())
);

CREATE POLICY op_docs_storage_update ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'operation-docs'
  AND owner_id = (select auth.uid()::text)
  AND (storage.foldername(name))[1] = (SELECT u.company_id::text FROM public.users u WHERE u.id = auth.uid())
)
WITH CHECK (
  bucket_id = 'operation-docs'
  AND owner_id = (select auth.uid()::text)
  AND (storage.foldername(name))[1] = (SELECT u.company_id::text FROM public.users u WHERE u.id = auth.uid())
);

CREATE POLICY op_docs_storage_delete ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'operation-docs'
  AND (storage.foldername(name))[1] = (SELECT u.company_id::text FROM public.users u WHERE u.id = auth.uid())
  AND (owner_id = (select auth.uid()::text) OR public.is_company_admin())
);