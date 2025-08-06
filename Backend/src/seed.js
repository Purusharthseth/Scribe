import db from './db/drizzle.js';
import { vaults, folders, files } from './db/schema.js';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // 1. Create example vault
    const [exampleVault] = await db
      .insert(vaults)
      .values({
        owner_id: 'user_example123', // Replace with actual Clerk user ID
        name: 'My First Vault',
        file_tree: [
          {
            id: 'folder_1',
            name: 'Documents',
            type: 'folder',
            children: [
              {
                id: 'file_1',
                name: 'README.md',
                type: 'file'
              },
              {
                id: 'file_2', 
                name: 'notes.txt',
                type: 'file'
              }
            ]
          },
          {
            id: 'file_3',
            name: 'root-file.md',
            type: 'file'
          }
        ],
        share_mode: 'private'
      })
      .returning();

    console.log('✅ Created vault:', exampleVault);

    // 2. Create example folder
    const [exampleFolder] = await db
      .insert(folders)
      .values({
        vault_id: exampleVault.id,
        parent_id: null, // Root folder
        name: 'Documents'
      })
      .returning();

    console.log('✅ Created folder:', exampleFolder);

    // 3. Create files in the folder
    const folderFiles = await db
      .insert(files)
      .values([
        {
          vault_id: exampleVault.id,
          folder_id: exampleFolder.id,
          name: 'README.md',
          content: '# Welcome to My Vault\n\nThis is an example README file.'
        },
        {
          vault_id: exampleVault.id,
          folder_id: exampleFolder.id,
          name: 'notes.txt',
          content: 'These are my personal notes.\n\n- Task 1\n- Task 2\n- Task 3'
        }
      ])
      .returning();

    console.log('✅ Created folder files:', folderFiles);

    // 4. Create a root-level file (directly in vault)
    const [rootFile] = await db
      .insert(files)
      .values({
        vault_id: exampleVault.id,
        folder_id: null, // Root level file
        name: 'root-file.md',
        content: '# Root Level File\n\nThis file is at the root of the vault, not in any folder.'
      })
      .returning();

    console.log('✅ Created root file:', rootFile);

    console.log('🎉 Database seeding completed successfully!');
    
    return {
      vault: exampleVault,
      folder: exampleFolder,
      files: [...folderFiles, rootFile]
    };

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seedDatabase()
  .then((result) => {
    console.log('\n📊 Seeding Summary:');
    console.log(`Vault ID: ${result.vault.id}`);
    console.log(`Folder ID: ${result.folder.id}`);
    console.log(`Files created: ${result.files.length}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed database:', error);
    process.exit(1);
  });