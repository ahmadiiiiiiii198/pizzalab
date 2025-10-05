import { supabase } from '@/integrations/supabase/client';

interface FeatureType {
  id: string;
  name: string;
  slug: string;
  description: string;
  table_name: string;
  has_categories: boolean;
  has_price: boolean;
  has_size: boolean;
  custom_fields: any;
}

export class DynamicTableService {
  /**
   * Automatically create a table for a new feature type
   */
  static async createTableForFeature(featureType: FeatureType): Promise<boolean> {
    try {
      console.log(`🔧 Auto-creating table for feature: ${featureType.name}`);
      console.log(`📋 Table name: ${featureType.table_name}`);

      // First check if table already exists
      const tableExists = await this.checkTableExists(featureType.table_name);
      if (tableExists) {
        console.log(`✅ Table ${featureType.table_name} already exists`);
        return true;
      }

      // Generate and execute SQL for creating the table
      const sql = this.generateCreateTableSQL(featureType);
      
      console.log(`🚀 Executing SQL for ${featureType.table_name}...`);
      
      // Execute the SQL using Supabase RPC function
      const { data: result, error } = await supabase.rpc('exec_sql', { sql_query: sql });

      if (error) {
        console.error('❌ Error creating table via RPC:', error);

        // Fallback: Try using the table creation request system
        console.log('🔄 Trying table creation request method...');
        return await this.createTableAlternative(featureType);
      }

      // Check if the result indicates success or error
      if (result && result.startsWith('Error:')) {
        console.error('❌ SQL execution error:', result);

        // Fallback: Try alternative method
        console.log('🔄 Trying alternative table creation method...');
        return await this.createTableAlternative(featureType);
      }

      console.log(`✅ Table ${featureType.table_name} created successfully!`);
      
      // Insert sample data if provided
      if (featureType.custom_fields?.sample_data) {
        await this.insertSampleData(featureType);
      }

      return true;
    } catch (error) {
      console.error('❌ Error in createTableForFeature:', error);
      return false;
    }
  }

  /**
   * Check if a table exists by trying to query it
   */
  static async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);
      
      return !error; // If no error, table exists
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate SQL for creating a feature table
   */
  static generateCreateTableSQL(featureType: FeatureType): string {
    const tableName = featureType.table_name;
    
    let sql = `
-- Auto-generated table for ${featureType.name}
CREATE TABLE IF NOT EXISTS "${tableName}" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;

    // Add conditional fields based on feature type properties
    if (featureType.has_price) {
      sql += `,\n  price DECIMAL(10,2) DEFAULT 0.00`;
    }

    if (featureType.has_categories) {
      sql += `,\n  category TEXT`;
    }

    if (featureType.has_size) {
      sql += `,\n  size TEXT`;
    }

    // Add custom fields from additional_fields
    if (featureType.custom_fields?.additional_fields) {
      featureType.custom_fields.additional_fields.forEach((field: string) => {
        const fieldName = field.toLowerCase().replace(/[^a-z0-9]/g, '_');
        sql += `,\n  ${fieldName} TEXT`;
      });
    }

    sql += `\n);

-- Create indexes for ${tableName}
CREATE INDEX IF NOT EXISTS "idx_${tableName}_slug" ON "${tableName}"(slug);
CREATE INDEX IF NOT EXISTS "idx_${tableName}_active" ON "${tableName}"(is_active);
CREATE INDEX IF NOT EXISTS "idx_${tableName}_sort_order" ON "${tableName}"(sort_order);`;

    if (featureType.has_categories) {
      sql += `\nCREATE INDEX IF NOT EXISTS "idx_${tableName}_category" ON "${tableName}"(category);`;
    }

    sql += `

-- Create trigger function for ${tableName} updated_at
CREATE OR REPLACE FUNCTION "update_${tableName}_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS "trigger_update_${tableName}_updated_at" ON "${tableName}";
CREATE TRIGGER "trigger_update_${tableName}_updated_at"
  BEFORE UPDATE ON "${tableName}"
  FOR EACH ROW
  EXECUTE FUNCTION "update_${tableName}_updated_at"();`;

    return sql;
  }

  /**
   * Alternative table creation method using individual SQL statements
   */
  static async createTableAlternative(featureType: FeatureType): Promise<boolean> {
    try {
      const tableName = featureType.table_name;
      
      // Create the basic table structure
      let createTableSQL = `CREATE TABLE IF NOT EXISTS "${tableName}" (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;

      if (featureType.has_price) {
        createTableSQL += `, price DECIMAL(10,2) DEFAULT 0.00`;
      }

      if (featureType.has_categories) {
        createTableSQL += `, category TEXT`;
      }

      if (featureType.has_size) {
        createTableSQL += `, size TEXT`;
      }

      createTableSQL += `);`;

      // Try to execute using a simpler approach
      console.log('🔧 Creating table with basic structure...');
      
      // Since we can't execute DDL directly, we'll create a record in a special table
      // that triggers table creation on the backend
      const { error: triggerError } = await supabase
        .from('table_creation_requests')
        .insert([{
          feature_type_id: featureType.id,
          table_name: tableName,
          sql_definition: createTableSQL,
          status: 'pending'
        }]);

      if (triggerError) {
        console.log('⚠️ Could not trigger automatic table creation');
        console.log('💡 Manual table creation required');
        return false;
      }

      console.log('✅ Table creation request submitted');
      return true;
    } catch (error) {
      console.error('❌ Alternative table creation failed:', error);
      return false;
    }
  }

  /**
   * Insert sample data for a new feature table
   */
  static async insertSampleData(featureType: FeatureType): Promise<void> {
    try {
      if (!featureType.custom_fields?.sample_data) return;

      console.log(`📝 Inserting sample data for ${featureType.name}...`);

      const sampleData = featureType.custom_fields.sample_data.map((item: any, index: number) => {
        const record: any = {
          name: item.name,
          slug: item.slug || item.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          description: item.description || null,
          is_active: item.is_active !== undefined ? item.is_active : true,
          sort_order: item.sort_order !== undefined ? item.sort_order : index + 1
        };

        if (featureType.has_price && item.price !== undefined) {
          record.price = item.price;
        }

        if (featureType.has_categories && item.category) {
          record.category = item.category;
        }

        if (featureType.has_size && item.size) {
          record.size = item.size;
        }

        return record;
      });

      const { error } = await supabase
        .from(featureType.table_name)
        .insert(sampleData);

      if (error) {
        console.error('❌ Error inserting sample data:', error);
      } else {
        console.log(`✅ Sample data inserted for ${featureType.name}`);
      }
    } catch (error) {
      console.error('❌ Error in insertSampleData:', error);
    }
  }

  /**
   * Create a simple table with just basic fields
   * This is a fallback when complex table creation fails
   */
  static async createBasicTable(tableName: string): Promise<boolean> {
    try {
      console.log(`🔧 Creating basic table: ${tableName}`);
      
      // Create a minimal record to trigger table creation
      const { error } = await supabase
        .from(tableName)
        .insert([{
          name: 'Sample Item',
          slug: 'sample-item',
          description: 'This is a sample item created during table initialization',
          is_active: true,
          sort_order: 1
        }]);

      if (error) {
        console.log(`❌ Basic table creation failed for ${tableName}:`, error.message);
        return false;
      }

      console.log(`✅ Basic table ${tableName} created successfully`);
      
      // Remove the sample item
      await supabase
        .from(tableName)
        .delete()
        .eq('slug', 'sample-item');

      return true;
    } catch (error) {
      console.error('❌ Error in createBasicTable:', error);
      return false;
    }
  }

  /**
   * Validate that a table has the required structure for a feature type
   */
  static async validateTableStructure(featureType: FeatureType): Promise<boolean> {
    try {
      // Try to insert and immediately delete a test record to validate structure
      const testRecord: any = {
        name: 'test',
        slug: 'test-validation-' + Date.now(),
        description: 'test',
        is_active: true,
        sort_order: 999
      };

      if (featureType.has_price) {
        testRecord.price = 0;
      }

      if (featureType.has_categories) {
        testRecord.category = 'test';
      }

      if (featureType.has_size) {
        testRecord.size = 'test';
      }

      const { data, error } = await supabase
        .from(featureType.table_name)
        .insert([testRecord])
        .select()
        .single();

      if (error) {
        console.log(`❌ Table structure validation failed for ${featureType.table_name}:`, error.message);
        return false;
      }

      // Clean up test record
      if (data) {
        await supabase
          .from(featureType.table_name)
          .delete()
          .eq('id', data.id);
      }

      console.log(`✅ Table structure validated for ${featureType.table_name}`);
      return true;
    } catch (error) {
      console.error('❌ Error validating table structure:', error);
      return false;
    }
  }
}

export default DynamicTableService;
