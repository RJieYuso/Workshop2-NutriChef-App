const ENV = {
    development: {
        API_URL: 'https://icsoywmvqyqcqtlfefsx.supabase.co/functions/v1', // Supabase Edge Functions
        SUPABASE_URL: 'https://icsoywmvqyqcqtlfefsx.supabase.co',
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljc295d212cXlxY3F0bGZlZnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2OTgzNzIsImV4cCI6MjA4MTI3NDM3Mn0.dy33uJZ_f9iOe1QijUe4nRFKUSG5ugpTNZ8nCyN-M2Q',
        APP_NAME: 'NutriChef',
        PYTHON_BACKEND_URL: 'https://joesph-corvine-ickily.ngrok-free.dev', // Ngrok tunnel for global access
    },
    staging: {
        API_URL: 'https://nutrichef-staging.onrender.com',
        SUPABASE_URL: 'https://mldooyezkxudfuzdpjyg.supabase.co',
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sZG9veWV6a3h1ZGZ1emRwanlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODkwODcsImV4cCI6MjA4MDI2NTA4N30.Jo7H9RVphBneRBTqX4TzxmmagBsKSE3E7LKrlIzGwtc',
        APP_NAME: 'NutriChef Beta',
    },
    production: {
        API_URL: 'https://api.nutrichef.app', // Your production URL
        SUPABASE_URL: 'https://mldooyezkxudfuzdpjyg.supabase.co',
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sZG9veWV6a3h1ZGZ1emRwanlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODkwODcsImV4cCI6MjA4MDI2NTA4N30.Jo7H9RVphBneRBTqX4TzxmmagBsKSE3E7LKrlIzGwtc',
        APP_NAME: 'NutriChef AI',
    }
};

const getEnv = () => {
    if (__DEV__) return ENV.development;
    // In a real app, you might check other env vars or build config here
    return ENV.production;
};

export default getEnv();
