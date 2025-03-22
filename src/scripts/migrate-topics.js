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
  
  console.log('Note: You need to create these tables manually in the Supabase dashboard.');
  console.log('Please follow these steps:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to the SQL Editor');
  console.log('3. Run the following SQL:');
  console.log(`
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
    
    // Create new tables (or check if they exist)
    const tablesCreated = await createNewTables();
    if (!tablesCreated) {
      console.error('Tables not ready. Migration aborted.');
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
