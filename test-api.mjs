// Simple script to test the API with a nonsensical prompt
import fetch from 'node-fetch';

async function testApi() {
  try {
    console.log('Testing API with nonsensical prompt...');
    
    const response = await fetch('http://localhost:3000/api/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: 'how many cups?' }),
    });
    
    const data = await response.json();
    console.log('API Response:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testApi();
