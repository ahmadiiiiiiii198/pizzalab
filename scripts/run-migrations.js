#!/usr/bin/env node

/**
 * Migration Runner for PizzaLab
 * This script manages database migrations
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
 * Execute SQL query
 */
async function executeQuery(sql, description = '') {
    try {
        if (description) {
            console.log(`🔄 ${description}`);
        }
        
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
            throw new Error(`SQL Error: ${error.message}`);
        }
        
        return data;
    } catch (err) {
        throw new Error(`Execution failed: ${err.message}`);
    }
}

/**
 * Initialize migration system
 */
async function initializeMigrationSystem() {
    console.log('🚀 Initializing Migration System...');
    
    try {
        // Read and execute the migration system SQL
        const migrationSystemSql = fs.readFileSync(
            path.join(__dirname, 'migration-system.sql'), 
            'utf8'
        );
        
        // Split into individual statements and execute
        const statements = migrationSystemSql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
            if (statement.trim()) {
                await executeQuery(statement + ';');
            }
        }
        
        console.log('✅ Migration system initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize migration system:', error.message);
        throw error;
    }
}

/**
 * Check if migration system is initialized
 */
async function checkMigrationSystem() {
    try {
        const result = await executeQuery(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'migrations'
            ) as exists
        `);
        
        return result?.[0]?.exists || false;
    } catch (error) {
        return false;
    }
}

/**
 * Get list of applied migrations
 */
async function getAppliedMigrations() {
    try {
        const result = await executeQuery(`
            SELECT migration_name, applied_at, status 
            FROM migrations 
            ORDER BY applied_at
        `);
        
        return result || [];
    } catch (error) {
        console.error('❌ Failed to get applied migrations:', error.message);
        return [];
    }
}

/**
 * Apply a new migration
 */
async function applyMigration(migrationName, description, sqlUp, sqlDown = null) {
    console.log(`🔄 Applying migration: ${migrationName}`);
    
    try {
        const startTime = Date.now();
        
        // Execute the migration SQL
        await executeQuery(sqlUp, `Executing migration: ${migrationName}`);
        
        const executionTime = Date.now() - startTime;
        
        // Record the migration
        await executeQuery(`
            SELECT record_migration(
                '${migrationName}',
                '${description.replace(/'/g, "''")}',
                '${sqlUp.replace(/'/g, "''")}',
                ${sqlDown ? `'${sqlDown.replace(/'/g, "''")}'` : 'NULL'}
            )
        `);
        
        // Update execution time
        await executeQuery(`
            UPDATE migrations 
            SET execution_time_ms = ${executionTime}
            WHERE migration_name = '${migrationName}'
        `);
        
        console.log(`✅ Migration ${migrationName} applied successfully (${executionTime}ms)`);
        
    } catch (error) {
        console.error(`❌ Failed to apply migration ${migrationName}:`, error.message);
        
        // Record failed migration
        try {
            await executeQuery(`
                INSERT INTO migrations (migration_name, description, sql_up, sql_down, status)
                VALUES (
                    '${migrationName}',
                    '${description.replace(/'/g, "''")}',
                    '${sqlUp.replace(/'/g, "''")}',
                    ${sqlDown ? `'${sqlDown.replace(/'/g, "''")}'` : 'NULL'},
                    'failed'
                )
            `);
        } catch (recordError) {
            console.error('❌ Failed to record failed migration:', recordError.message);
        }
        
        throw error;
    }
}

/**
 * Load migration files from directory
 */
function loadMigrationFiles(migrationDir = './migrations') {
    const migrationsPath = path.join(__dirname, migrationDir);
    
    if (!fs.existsSync(migrationsPath)) {
        console.log(`📁 Creating migrations directory: ${migrationsPath}`);
        fs.mkdirSync(migrationsPath, { recursive: true });
        return [];
    }
    
    const files = fs.readdirSync(migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();
    
    return files.map(file => {
        const content = fs.readFileSync(path.join(migrationsPath, file), 'utf8');
        const migrationName = path.basename(file, '.sql');
        
        // Parse migration file (simple format)
        const lines = content.split('\n');
        let description = '';
        let sqlUp = '';
        let sqlDown = '';
        let currentSection = 'description';
        
        for (const line of lines) {
            if (line.trim().startsWith('-- Description:')) {
                description = line.replace('-- Description:', '').trim();
            } else if (line.trim() === '-- UP') {
                currentSection = 'up';
            } else if (line.trim() === '-- DOWN') {
                currentSection = 'down';
            } else if (!line.trim().startsWith('--') && line.trim()) {
                if (currentSection === 'up') {
                    sqlUp += line + '\n';
                } else if (currentSection === 'down') {
                    sqlDown += line + '\n';
                }
            }
        }
        
        return {
            name: migrationName,
            description: description || `Migration ${migrationName}`,
            sqlUp: sqlUp.trim(),
            sqlDown: sqlDown.trim() || null,
            file
        };
    });
}

/**
 * Run pending migrations
 */
async function runPendingMigrations() {
    console.log('🔍 Checking for pending migrations...');
    
    try {
        const appliedMigrations = await getAppliedMigrations();
        const appliedNames = appliedMigrations.map(m => m.migration_name);
        
        const allMigrations = loadMigrationFiles();
        const pendingMigrations = allMigrations.filter(m => !appliedNames.includes(m.name));
        
        if (pendingMigrations.length === 0) {
            console.log('✅ No pending migrations found');
            return;
        }
        
        console.log(`📋 Found ${pendingMigrations.length} pending migrations:`);
        pendingMigrations.forEach(m => console.log(`   • ${m.name}: ${m.description}`));
        
        for (const migration of pendingMigrations) {
            await applyMigration(
                migration.name,
                migration.description,
                migration.sqlUp,
                migration.sqlDown
            );
        }
        
        console.log('🎉 All pending migrations applied successfully');
        
    } catch (error) {
        console.error('❌ Failed to run pending migrations:', error.message);
        throw error;
    }
}

/**
 * Show migration status
 */
async function showMigrationStatus() {
    console.log('📊 Migration Status');
    console.log('=' .repeat(60));
    
    try {
        const migrations = await getAppliedMigrations();
        
        if (migrations.length === 0) {
            console.log('📝 No migrations found');
            return;
        }
        
        console.table(migrations.map(m => ({
            Name: m.migration_name,
            Status: m.status,
            'Applied At': new Date(m.applied_at).toLocaleString()
        })));
        
    } catch (error) {
        console.error('❌ Failed to show migration status:', error.message);
    }
}

/**
 * Create a new migration file
 */
function createMigrationFile(name, description = '') {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const filename = `${timestamp}_${name}.sql`;
    const migrationPath = path.join(__dirname, 'migrations', filename);
    
    // Ensure migrations directory exists
    const migrationsDir = path.dirname(migrationPath);
    if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    const template = `-- Description: ${description || `Migration ${name}`}
-- Created: ${new Date().toISOString()}

-- UP
-- Add your migration SQL here


-- DOWN
-- Add rollback SQL here (optional)

`;
    
    fs.writeFileSync(migrationPath, template);
    console.log(`✅ Created migration file: ${filename}`);
    console.log(`📝 Edit the file to add your migration SQL`);
    
    return filename;
}

/**
 * Main CLI handler
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    try {
        // Check if migration system is initialized
        const isInitialized = await checkMigrationSystem();
        
        if (!isInitialized && command !== 'init') {
            console.log('⚠️  Migration system not initialized. Run with "init" command first.');
            return;
        }
        
        switch (command) {
            case 'init':
                await initializeMigrationSystem();
                break;
                
            case 'status':
                await showMigrationStatus();
                break;
                
            case 'migrate':
                await runPendingMigrations();
                break;
                
            case 'create':
                const name = args[1];
                const description = args.slice(2).join(' ');
                if (!name) {
                    console.error('❌ Please provide a migration name');
                    console.log('Usage: node run-migrations.js create <name> [description]');
                    return;
                }
                createMigrationFile(name, description);
                break;
                
            default:
                console.log('🔧 PizzaLab Migration Runner');
                console.log('');
                console.log('Commands:');
                console.log('  init                     Initialize migration system');
                console.log('  status                   Show migration status');
                console.log('  migrate                  Run pending migrations');
                console.log('  create <name> [desc]     Create new migration file');
                console.log('');
                console.log('Examples:');
                console.log('  node run-migrations.js init');
                console.log('  node run-migrations.js create add_user_preferences "Add user preferences table"');
                console.log('  node run-migrations.js migrate');
        }
        
    } catch (error) {
        console.error('❌ Command failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    initializeMigrationSystem,
    checkMigrationSystem,
    getAppliedMigrations,
    applyMigration,
    runPendingMigrations,
    showMigrationStatus,
    createMigrationFile
};
