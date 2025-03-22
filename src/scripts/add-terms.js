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
 * Get all existing terms
 */
async function getExistingTerms() {
  const { data, error } = await supabase
    .from('topics')
    .select('term')
    .order('term');
    
  if (error) {
    console.error('Error fetching terms:', error);
    return [];
  }
  
  return data.map(item => item.term);
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
  
  // Add the new term
  const { data, error } = await supabase
    .from('topics')
    .insert([{ term }]);
    
  if (error) {
    console.error('Error adding term:', error);
    return false;
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
