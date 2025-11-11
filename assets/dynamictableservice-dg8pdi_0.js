import{s as o}from"./main-DkQ9VdA2.js";class E{static async createTableForFeature(e){var t;try{if(console.log(`🔧 Auto-creating table for feature: ${e.name}`),console.log(`📋 Table name: ${e.table_name}`),await this.checkTableExists(e.table_name))return console.log(`✅ Table ${e.table_name} already exists`),!0;const s=this.generateCreateTableSQL(e);console.log(`🚀 Executing SQL for ${e.table_name}...`);const{data:a,error:i}=await o.rpc("exec_sql",{sql_query:s});return i?(console.error("❌ Error creating table via RPC:",i),console.log("🔄 Trying table creation request method..."),await this.createTableAlternative(e)):a&&a.startsWith("Error:")?(console.error("❌ SQL execution error:",a),console.log("🔄 Trying alternative table creation method..."),await this.createTableAlternative(e)):(console.log(`✅ Table ${e.table_name} created successfully!`),(t=e.custom_fields)!=null&&t.sample_data&&await this.insertSampleData(e),!0)}catch(r){return console.error("❌ Error in createTableForFeature:",r),!1}}static async checkTableExists(e){try{const{error:t}=await o.from(e).select("id").limit(1);return!t}catch{return!1}}static generateCreateTableSQL(e){var s;const t=e.table_name;let r=`
-- Auto-generated table for ${e.name}
CREATE TABLE IF NOT EXISTS "${t}" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;return e.has_price&&(r+=`,
  price DECIMAL(10,2) DEFAULT 0.00`),e.has_categories&&(r+=`,
  category TEXT`),e.has_size&&(r+=`,
  size TEXT`),(s=e.custom_fields)!=null&&s.additional_fields&&e.custom_fields.additional_fields.forEach(a=>{const i=a.toLowerCase().replace(/[^a-z0-9]/g,"_");r+=`,
  ${i} TEXT`}),r+=`
);

-- Create indexes for ${t}
CREATE INDEX IF NOT EXISTS "idx_${t}_slug" ON "${t}"(slug);
CREATE INDEX IF NOT EXISTS "idx_${t}_active" ON "${t}"(is_active);
CREATE INDEX IF NOT EXISTS "idx_${t}_sort_order" ON "${t}"(sort_order);`,e.has_categories&&(r+=`
CREATE INDEX IF NOT EXISTS "idx_${t}_category" ON "${t}"(category);`),r+=`

-- Create trigger function for ${t} updated_at
CREATE OR REPLACE FUNCTION "update_${t}_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS "trigger_update_${t}_updated_at" ON "${t}";
CREATE TRIGGER "trigger_update_${t}_updated_at"
  BEFORE UPDATE ON "${t}"
  FOR EACH ROW
  EXECUTE FUNCTION "update_${t}_updated_at"();`,r}static async createTableAlternative(e){try{const t=e.table_name;let r=`CREATE TABLE IF NOT EXISTS "${t}" (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;e.has_price&&(r+=", price DECIMAL(10,2) DEFAULT 0.00"),e.has_categories&&(r+=", category TEXT"),e.has_size&&(r+=", size TEXT"),r+=");",console.log("🔧 Creating table with basic structure...");const{error:s}=await o.from("table_creation_requests").insert([{feature_type_id:e.id,table_name:t,sql_definition:r,status:"pending"}]);return s?(console.log("⚠️ Could not trigger automatic table creation"),console.log("💡 Manual table creation required"),!1):(console.log("✅ Table creation request submitted"),!0)}catch(t){return console.error("❌ Alternative table creation failed:",t),!1}}static async insertSampleData(e){var t;try{if(!((t=e.custom_fields)!=null&&t.sample_data))return;console.log(`📝 Inserting sample data for ${e.name}...`);const r=e.custom_fields.sample_data.map((a,i)=>{const l={name:a.name,slug:a.slug||a.name.toLowerCase().replace(/[^a-z0-9]/g,"-"),description:a.description||null,is_active:a.is_active!==void 0?a.is_active:!0,sort_order:a.sort_order!==void 0?a.sort_order:i+1};return e.has_price&&a.price!==void 0&&(l.price=a.price),e.has_categories&&a.category&&(l.category=a.category),e.has_size&&a.size&&(l.size=a.size),l}),{error:s}=await o.from(e.table_name).insert(r);s?console.error("❌ Error inserting sample data:",s):console.log(`✅ Sample data inserted for ${e.name}`)}catch(r){console.error("❌ Error in insertSampleData:",r)}}static async createBasicTable(e){try{console.log(`🔧 Creating basic table: ${e}`);const{error:t}=await o.from(e).insert([{name:"Sample Item",slug:"sample-item",description:"This is a sample item created during table initialization",is_active:!0,sort_order:1}]);return t?(console.log(`❌ Basic table creation failed for ${e}:`,t.message),!1):(console.log(`✅ Basic table ${e} created successfully`),await o.from(e).delete().eq("slug","sample-item"),!0)}catch(t){return console.error("❌ Error in createBasicTable:",t),!1}}static async validateTableStructure(e){try{const t={name:"test",slug:"test-validation-"+Date.now(),description:"test",is_active:!0,sort_order:999};e.has_price&&(t.price=0),e.has_categories&&(t.category="test"),e.has_size&&(t.size="test");const{data:r,error:s}=await o.from(e.table_name).insert([t]).select().single();return s?(console.log(`❌ Table structure validation failed for ${e.table_name}:`,s.message),!1):(r&&await o.from(e.table_name).delete().eq("id",r.id),console.log(`✅ Table structure validated for ${e.table_name}`),!0)}catch(t){return console.error("❌ Error validating table structure:",t),!1}}}export{E as D};
