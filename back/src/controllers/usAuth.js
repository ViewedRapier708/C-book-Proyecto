const supa = require('@supabase/supabase-js');

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()
const supabaseUrl = process.env.URl
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)


export default methodsSupa