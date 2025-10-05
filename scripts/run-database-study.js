#!/usr/bin/env node

/**
 * Database Study Runner for PizzaLab
 * This script executes the database study SQL and formats the output
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'your-supabase-url';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your-service-key';

// Check if we're in a Node.js environment with required modules
let supabase;
try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
} catch (error) {
    console.error('❌ Supabase client not available. Please install @supabase/supabase-js');
    console.error('Run: npm install @supabase/supabase-js');
    process.exit(1);
}

/**
 * Execute SQL query and return results
 */
async function executeQuery(sql, description) {
    try {
        console.log(`\n🔍 ${description}`);
        console.log('=' .repeat(60));
        
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
            console.error(`❌ Error: ${error.message}`);
            return null;
        }
        
        if (data && data.length > 0) {
            console.table(data);
        } else {
            console.log('📝 No results returned');
        }
        
        return data;
    } catch (err) {
        console.error(`❌ Exception: ${err.message}`);
        return null;
    }
}

/**
 * Read SQL file and split into individual queries
 */
function readSqlFile(filename) {
    const filePath = path.join(__dirname, filename);
    if (!fs.existsSync(filePath)) {
        throw new Error(`SQL file not found: ${filePath}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Split by comments that start with "-- ============"
    const sections = content.split(/-- ={12,}/);
    
    return sections
        .filter(section => section.trim().length > 0)
        .map(section => {
            const lines = section.trim().split('\n');
            const title = lines[0]?.replace(/^--\s*/, '').trim() || 'Unnamed Section';
            const sql = lines
                .slice(1)
                .filter(line => !line.trim().startsWith('--') || line.includes('SELECT') || line.includes('FROM'))
                .join('\n')
                .trim();
            
            return { title, sql };
        })
        .filter(section => section.sql.length > 0);
}

/**
 * Main execution function
 */
async function runDatabaseStudy() {
    console.log('🚀 PizzaLab Database Study');
    console.log('📅 Started at:', new Date().toISOString());
    
    try {
        // Read and parse the SQL file
        const sections = readSqlFile('database-study.sql');
        console.log(`📋 Found ${sections.length} sections to execute`);
        
        // Execute each section
        for (const section of sections) {
            if (section.sql.trim()) {
                await executeQuery(section.sql, section.title);
                
                // Add a small delay to avoid overwhelming the database
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log('\n✅ Database study completed successfully');
        
    } catch (error) {
        console.error('❌ Error during database study:', error.message);
        process.exit(1);
    }
}

/**
 * Generate a summary report
 */
async function generateSummaryReport() {
    console.log('\n📊 SUMMARY REPORT');
    console.log('=' .repeat(60));
    
    try {
        // Get basic stats
        const tableCount = await executeQuery(
            "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public'",
            "Total Tables"
        );
        
        const orderStats = await executeQuery(
            `SELECT 
                COUNT(*) as total_orders,
                COUNT(CASE WHEN order_status = 'pending' THEN 1 END) as pending_orders,
                COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as delivered_orders,
                ROUND(AVG(total_amount), 2) as avg_order_value
            FROM orders`,
            "Order Statistics"
        );
        
        const productStats = await executeQuery(
            `SELECT 
                COUNT(*) as total_products,
                COUNT(CASE WHEN is_active = true THEN 1 END) as active_products,
                COUNT(DISTINCT category_id) as categories_with_products
            FROM products`,
            "Product Statistics"
        );
        
        console.log('\n📈 Key Metrics:');
        if (tableCount?.[0]) console.log(`   • Tables: ${tableCount[0].table_count}`);
        if (orderStats?.[0]) {
            console.log(`   • Total Orders: ${orderStats[0].total_orders}`);
            console.log(`   • Pending Orders: ${orderStats[0].pending_orders}`);
            console.log(`   • Average Order Value: €${orderStats[0].avg_order_value}`);
        }
        if (productStats?.[0]) {
            console.log(`   • Total Products: ${productStats[0].total_products}`);
            console.log(`   • Active Products: ${productStats[0].active_products}`);
        }
        
    } catch (error) {
        console.error('❌ Error generating summary:', error.message);
    }
}

/**
 * Export data to JSON for further analysis
 */
async function exportDataToJson() {
    console.log('\n💾 Exporting data to JSON...');
    
    try {
        const exportData = {
            timestamp: new Date().toISOString(),
            categories: await supabase.from('categories').select('*'),
            products: await supabase.from('products').select('*'),
            orders: await supabase.from('orders').select('*').limit(100),
            settings: await supabase.from('settings').select('*')
        };
        
        const filename = `database-export-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
        console.log(`✅ Data exported to: ${filename}`);
        
    } catch (error) {
        console.error('❌ Error exporting data:', error.message);
    }
}

// Main execution
if (require.main === module) {
    (async () => {
        await runDatabaseStudy();
        await generateSummaryReport();
        
        // Ask if user wants to export data
        if (process.argv.includes('--export')) {
            await exportDataToJson();
        }
        
        console.log('\n🎉 All done! Use --export flag to export data to JSON');
    })();
}

module.exports = {
    runDatabaseStudy,
    generateSummaryReport,
    exportDataToJson,
    executeQuery
};
