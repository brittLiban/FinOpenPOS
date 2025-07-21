"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminClient = createAdminClient;
// src/lib/supabase/service.ts
var supabase_js_1 = require("@supabase/supabase-js");
function createAdminClient() {
    var supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    return (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
}
