// Script to manage tools in the database
// Load environment variables first
import 'dotenv/config';
import { supabase } from '../utils/supabase.js';
import { getTools, getToolWithDetails, deleteTool, updateTool } from '../utils/database.js';
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
      .from('tools')
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
 * Get all tools from the database
 */
async function getAllTools() {
  const tools = await getTools();
  return tools.map(tool => ({
    id: tool.id,
    name: tool.name,
    petrahubid: tool.petrahubid
  }));
}

/**
 * Display all tools
 */
async function displayTools() {
  const tools = await getAllTools();
  
  console.log('\nAvailable Tools:');
  console.log('---------------');
  
  if (tools.length === 0) {
    console.log('No tools found.');
  } else {
    tools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name} (ID: ${tool.petrahubid})`);
    });
  }
  
  console.log('---------------\n');
  return tools;
}

/**
 * Format JSON for display
 */
function formatJSON(jsonString) {
  try {
    if (!jsonString) return 'N/A';
    const obj = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return jsonString || 'N/A';
  }
}

/**
 * Display tool details
 */
async function displayToolDetails(tool) {
  console.log('\nTool Details:');
  console.log('---------------');
  console.log(`Name: ${tool.name}`);
  console.log(`ID: ${tool.petrahubid}`);
  console.log(`Description: ${tool.description}`);
  console.log(`Homepage: ${tool.homepage || 'N/A'}`);
  console.log(`Accessibility: ${tool.accessibility || 'N/A'}`);
  console.log(`Cost: ${tool.cost || 'N/A'}`);
  console.log(`Development Stage: ${tool.development_stage || 'N/A'}`);
  console.log(`License: ${tool.license || 'N/A'}`);
  console.log(`Documentation: ${tool.documentation || 'N/A'}`);
  
  if (tool.citation) {
    console.log('\nCitation:');
    console.log(formatJSON(tool.citation));
  }
  
  if (tool.support) {
    console.log('\nSupport:');
    console.log(formatJSON(tool.support));
  }
  
  if (tool.topics && tool.topics.length > 0) {
    console.log('\nTopics:');
    tool.topics.forEach(topic => {
      console.log(`- ${topic.term}`);
    });
  }
  
  if (tool.operatingSystems && tool.operatingSystems.length > 0) {
    console.log('\nOperating Systems:');
    tool.operatingSystems.forEach(os => {
      console.log(`- ${os.name}`);
    });
  }
  
  if (tool.functions && tool.functions.length > 0) {
    console.log('\nFunctions:');
    tool.functions.forEach(func => {
      console.log(`- ${func.function_name}`);
      if (func.description) console.log(`  Description: ${func.description}`);
      if (func.note) console.log(`  Note: ${func.note}`);
    });
  }
  
  if (tool.toolTypes && tool.toolTypes.length > 0) {
    console.log('\nTool Types:');
    tool.toolTypes.forEach(type => {
      console.log(`- ${type.type}`);
    });
  }
  
  if (tool.languages && tool.languages.length > 0) {
    console.log('\nLanguages:');
    tool.languages.forEach(lang => {
      console.log(`- ${lang.name}`);
    });
  }
  
  console.log('---------------\n');
}

/**
 * Edit tool menu
 */
async function editToolMenu(tool) {
  console.log('\nEdit Tool Menu:');
  console.log('1. Edit Name');
  console.log('2. Edit Description');
  console.log('3. Edit Homepage');
  console.log('4. Edit Accessibility');
  console.log('5. Edit Cost');
  console.log('6. Edit Development Stage');
  console.log('7. Edit License');
  console.log('8. Edit Documentation');
  console.log('9. Edit Citation (JSON)');
  console.log('10. Edit Support (JSON)');
  console.log('11. Return to Main Menu');
  
  rl.question('Select an option (1-11): ', async (answer) => {
    const option = parseInt(answer.trim());
    
    if (isNaN(option) || option < 1 || option > 11) {
      console.log('Invalid option. Please try again.');
      await editToolMenu(tool);
      return;
    }
    
    if (option === 11) {
      await showMenu();
      return;
    }
    
    const fields = [
      'name', 'description', 'homepage', 'accessibility', 
      'cost', 'development_stage', 'license', 'documentation',
      'citation', 'support'
    ];
    const fieldToEdit = fields[option - 1];
    let currentValue = tool[fieldToEdit] || '';
    
    // Format JSON fields for display
    if (fieldToEdit === 'citation' || fieldToEdit === 'support') {
      currentValue = formatJSON(currentValue);
      console.log(`Current ${fieldToEdit}:\n${currentValue}`);
      console.log('\nEnter new JSON value (or press Enter to cancel):');
    } else {
      rl.question(`Enter new ${fieldToEdit} (current: ${currentValue}): `, async (newValue) => {
        if (newValue.trim() === '') {
          console.log('No changes made.');
          await editToolMenu(tool);
          return;
        }
        
        const updates = { [fieldToEdit]: newValue.trim() };
        const success = await updateTool(tool.id, updates);
        
        if (success) {
          console.log(`${fieldToEdit} updated successfully!`);
          // Refresh tool data
          const updatedTool = await getToolWithDetails(tool.petrahubid);
          await editToolMenu(updatedTool);
        } else {
          console.log(`Failed to update ${fieldToEdit}.`);
          await editToolMenu(tool);
        }
      });
      return;
    }
    
    // For JSON fields, we need to collect multi-line input
    let jsonInput = '';
    const jsonInputHandler = (line) => {
      if (line.trim() === 'DONE') {
        rl.removeListener('line', jsonInputHandler);
        
        try {
          // Validate JSON
          const jsonObject = JSON.parse(jsonInput);
          
          // Update the field
          updateTool(tool.id, { [fieldToEdit]: jsonInput })
            .then(success => {
              if (success) {
                console.log(`${fieldToEdit} updated successfully!`);
                // Refresh tool data
                getToolWithDetails(tool.petrahubid)
                  .then(updatedTool => {
                    editToolMenu(updatedTool);
                  });
              } else {
                console.log(`Failed to update ${fieldToEdit}.`);
                editToolMenu(tool);
              }
            });
        } catch (e) {
          console.error('Invalid JSON format:', e.message);
          editToolMenu(tool);
        }
      } else {
        jsonInput += line + '\n';
      }
    };
    
    console.log('Enter JSON data (type DONE on a new line when finished):');
    rl.on('line', jsonInputHandler);
  });
}

/**
 * Interactive menu
 */
async function showMenu() {
  console.log('\nTool Management Menu:');
  console.log('1. View all tools');
  console.log('2. View tool details');
  console.log('3. Edit tool');
  console.log('4. Delete tool');
  console.log('5. Exit');
  
  rl.question('Select an option (1-5): ', async (answer) => {
    switch (answer.trim()) {
      case '1':
        await displayTools();
        showMenu();
        break;
        
      case '2': {
        const tools = await displayTools();
        if (tools.length === 0) {
          showMenu();
          break;
        }
        
        rl.question('Enter the number of the tool to view: ', async (toolNumber) => {
          const index = parseInt(toolNumber) - 1;
          if (isNaN(index) || index < 0 || index >= tools.length) {
            console.log('Invalid tool number.');
            showMenu();
            return;
          }
          
          const toolDetails = await getToolWithDetails(tools[index].petrahubid);
          if (toolDetails) {
            await displayToolDetails(toolDetails);
          }
          showMenu();
        });
        break;
      }
        
      case '3': {
        const tools = await displayTools();
        if (tools.length === 0) {
          showMenu();
          break;
        }
        
        rl.question('Enter the number of the tool to edit: ', async (toolNumber) => {
          const index = parseInt(toolNumber) - 1;
          if (isNaN(index) || index < 0 || index >= tools.length) {
            console.log('Invalid tool number.');
            showMenu();
            return;
          }
          
          const toolDetails = await getToolWithDetails(tools[index].petrahubid);
          if (toolDetails) {
            await editToolMenu(toolDetails);
          } else {
            showMenu();
          }
        });
        break;
      }
        
      case '4': {
        const tools = await displayTools();
        if (tools.length === 0) {
          showMenu();
          break;
        }
        
        rl.question('Enter the number of the tool to delete: ', async (toolNumber) => {
          const index = parseInt(toolNumber) - 1;
          if (isNaN(index) || index < 0 || index >= tools.length) {
            console.log('Invalid tool number.');
            showMenu();
            return;
          }
          
          const tool = tools[index];
          rl.question(`Are you sure you want to delete "${tool.name}"? This cannot be undone. (yes/no): `, async (confirm) => {
            if (confirm.toLowerCase() === 'yes') {
              const success = await deleteTool(tool.id);
              if (success) {
                console.log(`Tool "${tool.name}" deleted successfully!`);
              } else {
                console.log(`Failed to delete tool "${tool.name}".`);
              }
            } else {
              console.log('Deletion cancelled.');
            }
            showMenu();
          });
        });
        break;
      }
        
      case '5':
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
  
  console.log('\nWelcome to the Tool Management System!');
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
