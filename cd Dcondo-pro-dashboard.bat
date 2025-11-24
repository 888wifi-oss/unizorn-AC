cd D:\condo-pro-dashboard
pnpm dev

   Policy Name: Allow users to view own slips
   Policy Type: SELECT
   Policy Definition:  (bucket_id = 'payment-slips' AND auth.role() = 'authenticated')company_admin', 'project_admin'))
   
      Policy Name: Allow admins to view all
   Policy Type: SELECT
   Policy Definition: (bucket_id = 'payment-slips' AND auth.role() IN ('super_admin', 'company_admin', 'project_admin'))
   
   
      Policy Name: Allow authenticated users to upload
   Policy Type: INSERT
   Policy Definition: (bucket_id = 'payment-slips' AND auth.role() = 'authenticated')
   ```

   **Policy 2: Allow users to view own files**
   ```
   Policy Name: Allow users to view own slips
   Policy Type: SELECT
   Policy Definition: (bucket_id = 'payment-slips' AND auth.role() = 'authenticated')