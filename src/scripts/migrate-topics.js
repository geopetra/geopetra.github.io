// Script to migrate topics to a many-to-many relationship
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
 * Create the new tables for the many-to-many relationship
 */
async function createNewTables() {
  console.log('Creating new tables...');
  
  // Create topic_terms table (similar to petrology_terms)
  const { error: createTopicTermsError } = await supabase.rpc('execute_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS topic_terms (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        term TEXT NOT NULL UNIQUE,
        uri TEXT,
        description TEXT
      );
    `
  });
  
  if (createTopicTermsError) {
    console.error('Error creating topic_terms table:', createTopicTermsError);
    return false;
  }
  
  // Create tool_topic_terms table (junction table)
  const { error: createJunctionError } = await supabase.rpc('execute_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS tool_topic_terms (
        tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
        term_id UUID REFERENCES topic_terms(id) ON DELETE CASCADE,
        PRIMARY KEY (tool_id, term_id)
      );
    `
  });
  
  if (createJunctionError) {
    console.error('Error creating tool_topic_terms table:', createJunctionError);
    return false;
  }
  
  console.log('New tables created successfully!');
  return true;
}

/**
 * Migrate data from the old topics table to the new structure
 */
async function migrateData() {
  console.log('Migrating data...');
  
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
      .insert([{ term }]);
      
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
      }]);
      
    if (junctionError) {
      console.error(`Error creating relationship for tool ${tool_id} and term "${term}":`, junctionError);
      continue;
    }
  }
  
  console.log('Data migration completed successfully!');
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
    
    // Create new tables
    const tablesCreated = await createNewTables();
    if (!tablesCreated) {
      console.error('Failed to create new tables. Migration aborted.');
      rl.close();
      return;
    }
    
    // Migrate data
    const dataMigrated = await migrateData();
    if (!dataMigrated) {
      console.error('Failed to migrate data. Some data may have been migrated.');
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
