// Script to add new terms to the database
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
    
    // Try to connect to topic_terms table, fall back to topics if it doesn't exist
    let { error } = await supabase
      .from('topic_terms')
      .select('*')
      .limit(1);
      
    if (error && error.code === '42P01') { // Table doesn't exist
      console.log('topic_terms table not found, checking topics table...');
      ({ data, error } = await supabase
        .from('topics')
        .select('*')
        .limit(1));
        
      if (!error) {
        console.log('Connection successful, but you need to migrate to the new schema.');
        console.log('Run: npm run migrate-topics');
      }
    }
    
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
 * Check if the database has the topic_terms table (new schema)
 */
async function checkForNewSchema() {
  try {
    const { error } = await supabase
      .from('topic_terms')
      .select('id')
      .limit(1);
    
    return !error;
  } catch (e) {
    return false;
  }
}

/**
 * Get all existing terms
 */
async function getExistingTerms() {
  const useNewSchema = await checkForNewSchema();
  
  if (useNewSchema) {
    const { data, error } = await supabase
      .from('topic_terms')
      .select('term')
      .order('term');
      
    if (error) {
      console.error('Error fetching terms:', error);
      return [];
    }
    
    return data.map(item => item.term);
  } else {
    const { data, error } = await supabase
      .from('topics')
      .select('term')
      .order('term');
      
    if (error) {
      console.error('Error fetching terms:', error);
      return [];
    }
    
    // Get unique terms since they might be duplicated in the old schema
    return [...new Set(data.map(item => item.term))];
  }
}

/**
 * Add a new term to the database
 */
async function addTerm(term) {
  // Check if term already exists
  const existingTerms = await getExistingTerms();
  if (existingTerms.includes(term)) {
    console.log(`Term "${term}" already exists.`);
    return false;
  }
  
  const useNewSchema = await checkForNewSchema();
  
  if (useNewSchema) {
    // Add the new term to topic_terms
    const { error } = await supabase
      .from('topic_terms')
      .insert([{ term }]);
      
    if (error) {
      console.error('Error adding term:', error);
      return false;
    }
  } else {
    // Add the new term to topics
    const { error } = await supabase
      .from('topics')
      .insert([{ term }]);
      
    if (error) {
      console.error('Error adding term:', error);
      return false;
    }
  }
  
  console.log(`Term "${term}" added successfully!`);
  return true;
}

/**
 * Display all existing terms
 */
async function displayTerms() {
  const terms = await getExistingTerms();
  
  console.log('\nExisting terms:');
  console.log('---------------');
  
  if (terms.length === 0) {
    console.log('No terms found.');
  } else {
    terms.forEach((term, index) => {
      console.log(`${index + 1}. ${term}`);
    });
  }
  
  console.log('---------------\n');
}

/**
 * Interactive menu
 */
async function showMenu() {
  console.log('\nTerm Management Menu:');
  console.log('1. View all terms');
  console.log('2. Add a new term');
  console.log('3. Exit');
  
  rl.question('Select an option (1-3): ', async (answer) => {
    switch (answer.trim()) {
      case '1':
        await displayTerms();
        showMenu();
        break;
        
      case '2':
        rl.question('Enter the new term: ', async (term) => {
          if (term.trim()) {
            await addTerm(term.trim());
          } else {
            console.log('Term cannot be empty.');
          }
          showMenu();
        });
        break;
        
      case '3':
        console.log('Exiting...');
        rl.close();
        break;
        
      default:
        console.log('Invalid option. Please try again.');
        showMenu();
        break;
    }
  });
}

// Main function
async function main() {
  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.error('Database connection failed. Exiting.');
    process.exit(1);
  }
  
  console.log('\nWelcome to the Term Management Tool!');
  await showMenu();
}

// Run the script
main().catch(err => {
  console.error('Script failed:', err);
  rl.close();
  process.exit(1);
});

// Handle exit
rl.on('close', () => {
  console.log('Goodbye!');
  process.exit(0);
});
