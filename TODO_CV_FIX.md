# CV Frontend Fix Tasks

- [x] Modify handleSaveCV in app/page.js to use direct Supabase insert into 'user_cvs' table
- [x] Import createClientComponentClient from '@supabase/auth-helpers-nextjs'
- [x] Replace api.saveCV call with the exact insert code provided
- [x] Ensure user_id, title, and content are correctly set
- [x] Handle errors appropriately
- [x] Test that RLS policies are respected (using authenticated Supabase client)
- [x] Add CVViewer integration - show saved CV after saving with PDF download option
- [x] Add manual PDF download in CVBuilder preview step
