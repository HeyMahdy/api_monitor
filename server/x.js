import postgres from 'postgres';
import net from 'net';

const connectionString = 'postgresql://neondb_owner:npg_gkisq61NDyoO@ep-red-mode-ahy92e04-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&options=endpoint%3Dep-red-mode-ahy92e04';

const sql = postgres(connectionString, {
  ssl: { rejectUnauthorized: false },
  connect_timeout: 10,
  socket: (options) => {
    // Handle both host and port as potential arrays
    const host = Array.isArray(options.host) ? options.host[0] : options.host;
    const port = Array.isArray(options.port) ? options.port[0] : options.port;
    
    console.log('Connecting to:', { host, port });
    
    return net.connect({
      host: host,
      port: port,
      family: 4 
    });
  }
});

async function test() {
  try {
    console.log('Attempting to connect via IPv4...');
    const result = await sql`SELECT version()`;
    console.log('✅ Success! Connected to:', result[0].version);
  } catch (err) {
    console.error('❌ Failed:', err);
  } finally {
    await sql.end();
  }
}

test();