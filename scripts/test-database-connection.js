#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('🧪 Testing Database Connection...\n');
  
  try {
    const prisma = new PrismaClient();
    
    console.log('1. Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    console.log('2. Testing basic query...');
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Basic query successful');
    console.log(`   Database version: ${result[0].version}`);
    
    console.log('3. Checking if tables exist...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log(`✅ Found ${tables.length} tables in database`);
    if (tables.length > 0) {
      console.log('   Tables:', tables.map(t => t.table_name).join(', '));
    }
    
    console.log('\n🎉 Database connection test completed successfully!');
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Make sure PostgreSQL is running');
      console.log('2. Check your DATABASE_URL in .env file');
      console.log('3. Verify database credentials');
      console.log('4. Run: npm run db:setup');
    }
    
    process.exit(1);
  }
}

testDatabaseConnection();
