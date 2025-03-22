// Script to manage tools in the database
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
  const { data, error } = await supabase
    .from('tools')
    .select('id, name, petrahubid')
    .order('name');
    
  if (error) {
    console.error('Error fetching tools:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get a tool with all its details
 */
async function getToolDetails(toolId) {
  const { data: tool, error } = await supabase
    .from('tools')
    .select(`
      *,
      functions(*),
      tool_types(*),
      topics(*),
      operating_systems(*),
      languages(*)
    `)
    .eq('id', toolId)
    .single();
    
  if (error) {
    console.error('Error fetching tool details:', error);
    return null;
  }
  
  return tool;
}

/**
 * Delete a tool and all its related data
 */
async function deleteTool(toolId) {
  // Due to cascade delete in the database schema, 
  // deleting the tool will automatically delete all related data
  const { error } = await supabase
    .from('tools')
    .delete()
    .eq('id', toolId);
    
  if (error) {
    console.error('Error deleting tool:', error);
    return false;
  }
  
  return true;
}

/**
 * Update basic tool information
 */
async function updateTool(toolId, updates) {
  const { error } = await supabase
    .from('tools')
    .update(updates)
    .eq('id', toolId);
    
  if (error) {
    console.error('Error updating tool:', error);
    return false;
  }
  
  return true;
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
 * Display tool details
 */
async function displayToolDetails(tool) {
  console.log('\nTool Details:');
  console.log('---------------');
  console.log(`Name: ${tool.name}`);
  console.log(`ID: ${tool.petrahubid}`);
  console.log(`Description: ${tool.description}`);
  console.log(`Homepage: ${tool.homepage || 'N/A'}`);
  console.log(`Version: ${tool.version || 'N/A'}`);
  console.log(`Accessibility: ${tool.accessibility || 'N/A'}`);
  console.log(`Cost: ${tool.cost || 'N/A'}`);
  console.log(`Maturity: ${tool.maturity || 'N/A'}`);
  console.log(`License: ${tool.license || 'N/A'}`);
  
  if (tool.topics && tool.topics.length > 0) {
    console.log('\nTopics:');
    tool.topics.forEach(topic => {
      console.log(`- ${topic.term}`);
    });
  }
  
  if (tool.operating_systems && tool.operating_systems.length > 0) {
    console.log('\nOperating Systems:');
    tool.operating_systems.forEach(os => {
      console.log(`- ${os.name}`);
    });
  }
  
  if (tool.functions && tool.functions.length > 0) {
    console.log('\nFunctions:');
    tool.functions.forEach(func => {
      console.log(`- ${func.operation.join(', ')}${func.note ? ` (${func.note})` : ''}`);
    });
  }
  
  if (tool.tool_types && tool.tool_types.length > 0) {
    console.log('\nTool Types:');
    tool.tool_types.forEach(type => {
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
  console.log('4. Edit Version');
  console.log('5. Edit Accessibility');
  console.log('6. Edit Cost');
  console.log('7. Edit Maturity');
  console.log('8. Edit License');
  console.log('9. Return to Main Menu');
  
  rl.question('Select an option (1-9): ', async (answer) => {
    const option = parseInt(answer.trim());
    
    if (isNaN(option) || option < 1 || option > 9) {
      console.log('Invalid option. Please try again.');
      await editToolMenu(tool);
      return;
    }
    
    if (option === 9) {
      await showMenu();
      return;
    }
    
    const fields = ['name', 'description', 'homepage', 'version', 'accessibility', 'cost', 'maturity', 'license'];
    const fieldToEdit = fields[option - 1];
    const currentValue = tool[fieldToEdit] || '';
    
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
        const updatedTool = await getToolDetails(tool.id);
        await editToolMenu(updatedTool);
      } else {
        console.log(`Failed to update ${fieldToEdit}.`);
        await editToolMenu(tool);
      }
    });
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
          
          const toolDetails = await getToolDetails(tools[index].id);
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
          
          const toolDetails = await getToolDetails(tools[index].id);
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
