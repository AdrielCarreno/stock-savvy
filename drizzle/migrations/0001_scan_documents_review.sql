CREATE TABLE public.scan_documents (
 id uuid PRIMARY KEY,
 company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 uploaded_by uuid NOT NULL,
 file_name text NOT NULL,
 file_path text NOT NULL,
 file_size bigint NOT NULL CHECK (file_size >= 0 AND file_size <= 10485760),
 doc_type text NOT NULL CHECK (doc_type IN ('Factura', 'Remito', 'Comprobante')),
 reviewed_text text NOT NULL DEFAULT '',
 confirmed_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT scan_document_company_path CHECK (split_part(file_path, '/', 1) = company_id::text AND split_part(file_path, '/', 2) = 'scans' AND split_part(file_path, '/', 3) = id::text)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scan_documents TO authenticated;
GRANT ALL ON public.scan_documents TO service_role;
ALTER TABLE public.scan_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY scan_documents_select ON public.scan_documents FOR SELECT TO authenticated USING (company_id = public.current_company_id() AND public.current_company_is_active() AND (uploaded_by = auth.uid() OR public.is_company_admin()));
CREATE POLICY scan_documents_insert ON public.scan_documents FOR INSERT TO authenticated WITH CHECK (company_id = public.current_company_id() AND public.current_company_is_active() AND uploaded_by = auth.uid());
CREATE POLICY scan_documents_update ON public.scan_documents FOR UPDATE TO authenticated USING (company_id = public.current_company_id() AND public.current_company_is_active() AND uploaded_by = auth.uid()) WITH CHECK (company_id = public.current_company_id() AND public.current_company_is_active() AND uploaded_by = auth.uid());
CREATE POLICY scan_documents_delete ON public.scan_documents FOR DELETE TO authenticated USING (company_id = public.current_company_id() AND public.current_company_is_active() AND (uploaded_by = auth.uid() OR public.is_company_admin()));
CREATE INDEX scan_documents_company_created ON public.scan_documents (company_id, created_at DESC);