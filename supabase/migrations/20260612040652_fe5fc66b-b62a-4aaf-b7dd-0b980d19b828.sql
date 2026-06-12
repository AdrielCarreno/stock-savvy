
CREATE POLICY "op_docs_storage_select" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'operation-docs'
  AND (storage.foldername(name))[1] = (SELECT company_id::text FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "op_docs_storage_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'operation-docs'
  AND (storage.foldername(name))[1] = (SELECT company_id::text FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "op_docs_storage_delete" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'operation-docs'
  AND (storage.foldername(name))[1] = (SELECT company_id::text FROM public.users WHERE id = auth.uid())
);
