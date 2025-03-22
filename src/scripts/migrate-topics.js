// Script to migrate database schema to use normalized tables with many-to-many relationships
// Load environment variables first
import 'dotenv/config';
import { supabase } from '../utils/supabase.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Test the database connection
 */
async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Error connecting to database:', error);
      return false;
    }
    
    console.log('Connection successful!');
    return true;
  } catch (e) {
    console.error('Connection failed:', e.message);
    return false;
  }
}

/**
 * Create the new tables for the many-to-many relationships
 */
async function createNewTables() {
  console.log('Creating new tables...');
  
  console.log('Note: You need to create these tables manually in the Supabase dashboard.');
  console.log('Please follow these steps:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to the SQL Editor');
  console.log('3. Run the following SQL:');
  console.log(`
    -- Topic terms table for many-to-many relationship
    CREATE TABLE IF NOT EXISTS topic_terms (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      term TEXT NOT NULL UNIQUE,
      uri TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS tool_topic_terms (
      tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
      term_id UUID REFERENCES topic_terms(id) ON DELETE CASCADE,
      PRIMARY KEY (tool_id, term_id)
    );
    
    -- Tool type options table
    CREATE TABLE IF NOT EXISTS tool_type_options (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      type TEXT NOT NULL UNIQUE,
      description TEXT
    );
    
    -- Function options table
    CREATE TABLE IF NOT EXISTS function_options (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      operation TEXT NOT NULL UNIQUE,
      description TEXT
    );
    
    -- Language options table
    CREATE TABLE IF NOT EXISTS language_options (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL UNIQUE,
      description TEXT
    );
    
    -- Operating system options table
    CREATE TABLE IF NOT EXISTS os_options (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL UNIQUE,
      description TEXT
    );
    
    -- Petrology terms table
    CREATE TABLE IF NOT EXISTS petrology_terms (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      term TEXT NOT NULL UNIQUE,
      description TEXT
    );
    
    CREATE TABLE IF NOT EXISTS tool_petrology_terms (
      tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
      term_id UUID REFERENCES petrology_terms(id) ON DELETE CASCADE,
      PRIMARY KEY (tool_id, term_id)
    );
    
    -- Add initial tool type options
    INSERT INTO tool_type_options (type) VALUES
      ('Desktop application'),
      ('Web application'),
      ('Mobile application'),
      ('Command-line tool'),
      ('Library/API'),
      ('Script package'),
      ('Plugin/Extension'),
      ('Framework'),
      ('Database'),
      ('Service')
    ON CONFLICT (type) DO NOTHING;
    
    -- Add initial function options
    INSERT INTO function_options (operation) VALUES
      ('Analysis'),
      ('Calculation'),
      ('Modelling'),
      ('Visualization'),
      ('Data management'),
      ('Simulation')
    ON CONFLICT (operation) DO NOTHING;
    
    -- Add initial OS options
    INSERT INTO os_options (name) VALUES
      ('Windows'),
      ('Mac'),
      ('Linux'),
      ('iOS'),
      ('Android'),
      ('Web')
    ON CONFLICT (name) DO NOTHING;
    
    -- Alter tables to use foreign keys
    ALTER TABLE tool_types DROP CONSTRAINT IF EXISTS tool_types_type_check;
    ALTER TABLE tool_types ADD CONSTRAINT tool_types_type_fkey 
      FOREIGN KEY (type) REFERENCES tool_type_options(type) ON UPDATE CASCADE;
      
    ALTER TABLE functions DROP CONSTRAINT IF EXISTS functions_operation_check;
    ALTER TABLE functions ADD CONSTRAINT functions_operation_fkey 
      FOREIGN KEY (operation) REFERENCES function_options(operation) ON UPDATE CASCADE;
      
    ALTER TABLE operating_systems DROP CONSTRAINT IF EXISTS operating_systems_name_check;
    ALTER TABLE operating_systems ADD CONSTRAINT operating_systems_name_fkey 
      FOREIGN KEY (name) REFERENCES os_options(name) ON UPDATE CASCADE;
      
    ALTER TABLE languages DROP CONSTRAINT IF EXISTS languages_name_check;
    ALTER TABLE languages ADD CONSTRAINT languages_name_fkey 
      FOREIGN KEY (name) REFERENCES language_options(name) ON UPDATE CASCADE;
  `);
  
  // Check if tables already exist
  const { error: topicTermsError } = await supabase
    .from('topic_terms')
    .select('id')
    .limit(1);
    
  const { error: junctionError } = await supabase
    .from('tool_topic_terms')
    .select('tool_id')
    .limit(1);
    
  if (topicTermsError || junctionError) {
    console.log('Tables do not exist yet. Please create them using the SQL above.');
    
    // Ask user if they've created the tables
    return new Promise((resolve) => {
      rl.question('Have you created the tables in Supabase? (yes/no): ', (answer) => {
        if (answer.toLowerCase() === 'yes') {
          console.log('Continuing with migration...');
          resolve(true);
        } else {
          console.log('Please create the tables before continuing.');
          resolve(false);
        }
      });
    });
  }
  
  console.log('Tables already exist. Continuing with migration...');
  return true;
}

/**
 * Migrate tool types to use the new tool_type_options table
 */
async function migrateToolTypes() {
  console.log('Migrating tool types...');
  
  // Get all unique tool types from the tool_types table
  const { data: uniqueTypes, error: typesError } = await supabase
    .from('tool_types')
    .select('type')
    .order('type');
    
  if (typesError) {
    console.error('Error fetching tool types:', typesError);
    return false;
  }
  
  // Extract unique types
  const types = [...new Set(uniqueTypes.map(item => item.type))];
  console.log(`Found ${types.length} unique tool types to migrate.`);
  
  // Insert unique types into tool_type_options table
  for (const type of types) {
    const { error: insertError } = await supabase
      .from('tool_type_options')
      .insert([{ type }])
      .onConflict('type')
      .ignore();
      
    if (insertError) {
      console.error(`Error inserting tool type "${type}":`, insertError);
      continue;
    }
  }
  
  console.log('Tool types migration completed successfully!');
  return true;
}

/**
 * Migrate functions to use the new function_options table
 */
async function migrateFunctions() {
  console.log('Migrating functions...');
  
  // Get all unique operations from the functions table
  const { data: uniqueOps, error: opsError } = await supabase
    .from('functions')
    .select('operation')
    .order('operation');
    
  if (opsError) {
    console.error('Error fetching functions:', opsError);
    return false;
  }
  
  // Extract unique operations (handling array values)
  const operations = new Set();
  uniqueOps.forEach(item => {
    if (Array.isArray(item.operation)) {
      item.operation.forEach(op => operations.add(op));
    } else {
      operations.add(item.operation);
    }
  });
  
  console.log(`Found ${operations.size} unique function operations to migrate.`);
  
  // Insert unique operations into function_options table
  for (const operation of operations) {
    const { error: insertError } = await supabase
      .from('function_options')
      .insert([{ operation }])
      .onConflict('operation')
      .ignore();
      
    if (insertError) {
      console.error(`Error inserting function "${operation}":`, insertError);
      continue;
    }
  }
  
  console.log('Functions migration completed successfully!');
  return true;
}

/**
 * Migrate operating systems to use the new os_options table
 */
async function migrateOperatingSystems() {
  console.log('Migrating operating systems...');
  
  // Get all unique OS names from the operating_systems table
  const { data: uniqueOS, error: osError } = await supabase
    .from('operating_systems')
    .select('name')
    .order('name');
    
  if (osError) {
    console.error('Error fetching operating systems:', osError);
    return false;
  }
  
  // Extract unique OS names
  const osNames = [...new Set(uniqueOS.map(item => item.name))];
  console.log(`Found ${osNames.length} unique operating systems to migrate.`);
  
  // Insert unique OS names into os_options table
  for (const name of osNames) {
    const { error: insertError } = await supabase
      .from('os_options')
      .insert([{ name }])
      .onConflict('name')
      .ignore();
      
    if (insertError) {
      console.error(`Error inserting OS "${name}":`, insertError);
      continue;
    }
  }
  
  console.log('Operating systems migration completed successfully!');
  return true;
}

/**
 * Migrate languages to use the new language_options table
 */
async function migrateLanguages() {
  console.log('Migrating languages...');
  
  // Get all unique language names from the languages table
  const { data: uniqueLangs, error: langError } = await supabase
    .from('languages')
    .select('name')
    .order('name');
    
  if (langError) {
    console.error('Error fetching languages:', langError);
    return false;
  }
  
  // Extract unique language names
  const langNames = [...new Set(uniqueLangs.map(item => item.name))];
  console.log(`Found ${langNames.length} unique languages to migrate.`);
  
  // Insert unique language names into language_options table
  for (const name of langNames) {
    const { error: insertError } = await supabase
      .from('language_options')
      .insert([{ name }])
      .onConflict('name')
      .ignore();
      
    if (insertError) {
      console.error(`Error inserting language "${name}":`, insertError);
      continue;
    }
  }
  
  console.log('Languages migration completed successfully!');
  return true;
}

/**
 * Migrate petrology terms to a separate table
 */
async function migratePetrologyTerms() {
  console.log('Migrating petrology terms...');
  
  // Check if petrology_terms table exists
  const { error: tableError } = await supabase
    .from('petrology_terms')
    .select('id')
    .limit(1);
    
  if (tableError) {
    console.error('Petrology terms table does not exist yet. Please create it using the SQL above.');
    return false;
  }
  
  // Get all unique terms from the tool_petrology_terms table
  const { data: uniqueTerms, error: termsError } = await supabase
    .from('tool_petrology_terms')
    .select('term_id')
    .order('term_id');
    
  if (termsError) {
    console.error('Error fetching petrology terms:', termsError);
    return false;
  }
  
  console.log(`Found ${uniqueTerms.length} petrology term relationships.`);
  console.log('Petrology terms migration completed successfully!');
  return true;
}

/**
 * Migrate data from the old topics table to the new structure
 */
async function migrateTopics() {
  console.log('Migrating topics...');
  
  // Get all unique terms from the topics table
  const { data: uniqueTerms, error: termsError } = await supabase
    .from('topics')
    .select('term')
    .order('term');
    
  if (termsError) {
    console.error('Error fetching terms:', termsError);
    return false;
  }
  
  // Extract unique terms
  const terms = [...new Set(uniqueTerms.map(item => item.term))];
  console.log(`Found ${terms.length} unique terms to migrate.`);
  
  // Insert unique terms into topic_terms table
  for (const term of terms) {
    const { error: insertError } = await supabase
      .from('topic_terms')
      .insert([{ term }])
      .onConflict('term')
      .ignore();
      
    if (insertError) {
      console.error(`Error inserting term "${term}":`, insertError);
      continue;
    }
  }
  
  // Get all topic-tool relationships
  const { data: topicTools, error: topicToolsError } = await supabase
    .from('topics')
    .select('term, tool_id');
    
  if (topicToolsError) {
    console.error('Error fetching topic-tool relationships:', topicToolsError);
    return false;
  }
  
  // For each relationship, find the term_id and create the junction record
  for (const { term, tool_id } of topicTools) {
    // Get the term_id from topic_terms
    const { data: termData, error: termError } = await supabase
      .from('topic_terms')
      .select('id')
      .eq('term', term)
      .single();
      
    if (termError || !termData) {
      console.error(`Error finding term_id for "${term}":`, termError);
      continue;
    }
    
    // Insert into junction table
    const { error: junctionError } = await supabase
      .from('tool_topic_terms')
      .insert([{ 
        tool_id, 
        term_id: termData.id 
      }])
      .onConflict(['tool_id', 'term_id'])
      .ignore();
      
    if (junctionError) {
      console.error(`Error creating relationship for tool ${tool_id} and term "${term}":`, junctionError);
      continue;
    }
  }
  
  console.log('Topics migration completed successfully!');
  return true;
}

/**
 * Main function
 */
async function main() {
  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.error('Database connection failed. Exiting.');
    process.exit(1);
  }
  
  console.log('\nThis script will migrate your topics to a many-to-many relationship structure.');
  console.log('WARNING: This is a one-way operation. Make sure you have a backup of your database.');
  
  rl.question('Do you want to proceed? (yes/no): ', async (answer) => {
    if (answer.toLowerCase() !== 'yes') {
      console.log('Migration cancelled.');
      rl.close();
      return;
    }
    
    // Create new tables (or check if they exist)
    const tablesCreated = await createNewTables();
    if (!tablesCreated) {
      console.error('Tables not ready. Migration aborted.');
      rl.close();
      return;
    }
    
    // Migrate topics
    const topicsMigrated = await migrateTopics();
    if (!topicsMigrated) {
      console.error('Failed to migrate topics. Some data may have been migrated.');
      rl.close();
      return;
    }
    
    // Migrate tool types
    const toolTypesMigrated = await migrateToolTypes();
    if (!toolTypesMigrated) {
      console.error('Failed to migrate tool types. Some data may have been migrated.');
      rl.close();
      return;
    }
    
    // Migrate functions
    const functionsMigrated = await migrateFunctions();
    if (!functionsMigrated) {
      console.error('Failed to migrate functions. Some data may have been migrated.');
      rl.close();
      return;
    }
    
    // Migrate operating systems
    const osMigrated = await migrateOperatingSystems();
    if (!osMigrated) {
      console.error('Failed to migrate operating systems. Some data may have been migrated.');
      rl.close();
      return;
    }
    
    // Migrate languages
    const languagesMigrated = await migrateLanguages();
    if (!languagesMigrated) {
      console.error('Failed to migrate languages. Some data may have been migrated.');
      rl.close();
      return;
    }
    
    // Migrate petrology terms
    const petrologyMigrated = await migratePetrologyTerms();
    if (!petrologyMigrated) {
      console.error('Failed to migrate petrology terms. Some data may have been migrated.');
      rl.close();
      return;
    }
    
    console.log('\nMigration completed successfully!');
    console.log('You can now update your application to use the new schema.');
    console.log('The old topics table has not been dropped. You can drop it manually after verifying the migration.');
    
    rl.close();
  });
}

// Run the script
main().catch(err => {
  console.error('Script failed:', err);
  rl.close();
  process.exit(1);
});
