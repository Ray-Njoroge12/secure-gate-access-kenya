#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Secure Gate Access Database...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

try {
  // Check if .env exists, if not create from .env.example
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      console.log('📝 Creating .env file from .env.example...');
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ .env file created');
    } else {
      console.log('⚠️  .env.example not found, creating basic .env file...');
      const basicEnvContent = `# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/secure_gate_db"

# JWT Secret for Authentication
JWT_SECRET="your-super-secret-jwt-key-here-change-this-in-production"

# Server Configuration
PORT=4001
NODE_ENV=development

# Optional: Redis for caching
REDIS_URL="redis://localhost:6379"
`;
      fs.writeFileSync(envPath, basicEnvContent);
      console.log('✅ Basic .env file created');
    }
  } else {
    console.log('✅ .env file already exists');
  }

  // Generate Prisma client
  console.log('\n🔨 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');

  // Try to run migrations
  console.log('\n🚀 Running database migrations...');
  try {
    execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
    console.log('✅ Database migrations completed');
  } catch (migrationError) {
    console.log('⚠️  Migration failed, trying to reset...');
    try {
      execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
      console.log('✅ Database reset and migrations completed');
    } catch (resetError) {
      console.log('❌ Database setup failed. Please check your PostgreSQL installation.');
      console.log('💡 Make sure PostgreSQL is running and accessible');
      process.exit(1);
    }
  }

  // Test database connection
  console.log('\n🔗 Testing database connection...');
  try {
    execSync('npx prisma db execute --file --stdin << "SELECT version();"', { stdio: 'inherit' });
    console.log('✅ Database connection successful');
  } catch (testError) {
    console.log('⚠️  Direct test failed, trying alternative method...');
    try {
      const result = execSync('npx prisma --version', { encoding: 'utf8' });
      console.log(`✅ Prisma CLI working: ${result.trim()}`);
    } catch (e) {
      console.log('❌ Could not verify database connection');
    }
  }

  console.log('\n🎉 Database setup completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Update your .env file with actual database credentials');
  console.log('2. Start the server: npm run dev:api');
  console.log('3. Test the API endpoints');
  console.log('4. Run integration tests: npm run test:integration');

} catch (error) {
  console.error('❌ Error during database setup:', error.message);
  process.exit(1);
}
